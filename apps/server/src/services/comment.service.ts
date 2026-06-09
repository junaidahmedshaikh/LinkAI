import { CommentHistory } from "../models/CommentHistory.model";
import { Profile } from "../models/Profile.model";
import { aiProviderService } from "./ai-provider.service";
import { settingsService } from "./settings.service";
import { activityService } from "./activity.service";
import { featureFlagService } from "./feature-flag.service";
import { userContextService } from "./sync.service";
import { eventService } from "./event.service";
import { rateLimitService } from "./rate-limit.service";
import type {
  CommentTone,
  ICommentHistoryItem,
  IGenerateCommentRequest,
  IGenerateCommentResponse,
} from "@linkai/types";

class CommentService {
  async ensureFeatureEnabled(): Promise<void> {
    const enabled = await featureFlagService.isEnabled("AI_COMMENTS");
    if (!enabled) {
      throw new Error("AI Comments feature is not enabled");
    }
  }

  async generate(
    userId: string,
    payload: IGenerateCommentRequest
  ): Promise<IGenerateCommentResponse> {
    await this.ensureFeatureEnabled();

    // Validate post content
    const postContent = payload.postContent?.trim();
    if (!postContent || postContent.length < 10) {
      throw new Error("Post content is too short to generate a comment (minimum 10 characters)");
    }

    if (postContent.length > 5000) {
      throw new Error("Post content exceeds maximum length (5000 characters)");
    }

    // Get user settings and check rate limit
    const settings = await settingsService.getOrCreate(userId);

    // Ensure usageStats is properly initialized
    if (!settings.usageStats.commentsGeneratedToday) {
      settings.usageStats.commentsGeneratedToday = 0;
    }

    // Check if we need to reset daily count
    const lastReset = new Date(settings.usageStats.lastResetDate || new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastReset.setHours(0, 0, 0, 0);

    if (today.getTime() > lastReset.getTime()) {
      // New day, reset count
      settings.usageStats.commentsGeneratedToday = 0;
      settings.usageStats.lastResetDate = new Date();
    }

    // Check rate limit
    const user = await (this.constructor as any).getUserById?.(userId);
    const dailyLimit = rateLimitService.getCommentLimit(user?.subscriptionPlan || "free");

    if ((settings.usageStats.commentsGeneratedToday ?? 0) >= dailyLimit) {
      const remaining = rateLimitService.getRemainingComments(
        userId,
        settings.usageStats.commentsGeneratedToday ?? 0
      );
      throw new Error(
        `Daily comment limit (${dailyLimit}) exceeded. Please try again tomorrow.`
      );
    }

    // Get user profile for context
    const profile = await Profile.findOne({ userId }).lean();
    const userName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : undefined;

    // Generate comment via AI provider
    let generatedComment;
    try {
      // Extract hashtags from post content
      const hashtagRegex = /#(\w+)/g;
      const hashtags = Array.from(postContent.matchAll(hashtagRegex)).map((m) => m[1]);

      generatedComment = await aiProviderService.generateComment(
        postContent,
        payload.tone,
        {
          author: payload.postAuthor,
          userName: userName || undefined,
          userHeadline: profile?.headline,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
        }
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to generate comment";
      throw new Error(`Comment generation failed: ${errorMsg}`);
    }

    // Save to history
    const historyEntry = await CommentHistory.create({
      userId,
      postContent: postContent.slice(0, 5000),
      postAuthor: payload.postAuthor,
      postUrl: payload.postUrl,
      tone: payload.tone,
      generatedText: generatedComment.text,
      tokensUsed: generatedComment.tokensUsed || 0,
    });

    // Update usage stats
    settings.usageStats.commentsGeneratedToday = (settings.usageStats.commentsGeneratedToday ?? 0) + 1;
    settings.usageStats.commentsGenerated = (settings.usageStats.commentsGenerated ?? 0) + 1;
    settings.usageStats.tokensUsedTotal = (settings.usageStats.tokensUsedTotal || 0) +
      (generatedComment.tokensUsed || 0);
    await settings.save({ validateBeforeSave: false });

    // Invalidate cache and emit event
    userContextService.invalidateUser(userId);
    eventService.emit(userId, "USAGE_UPDATED");

    // Log activity
    await activityService.log(
      userId,
      "COMMENT_GENERATED",
      `Generated ${payload.tone} comment`,
      {
        tone: payload.tone,
        postUrl: payload.postUrl,
        tokensUsed: generatedComment.tokensUsed,
      }
    );

    // Calculate remaining comments
    const dailyRemaining = Math.max(0, dailyLimit - (settings.usageStats.commentsGeneratedToday ?? 0));

    return {
      comment: generatedComment,
      dailyRemaining,
      usageRemaining: dailyRemaining,
    };
  }

  async getHistory(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ items: ICommentHistoryItem[]; total: number }> {
    const actualLimit = Math.min(Math.max(limit, 1), 100);
    const actualOffset = Math.max(offset, 0);

    const items = await CommentHistory.find({ userId })
      .sort({ createdAt: -1 })
      .skip(actualOffset)
      .limit(actualLimit)
      .lean();

    const total = await CommentHistory.countDocuments({ userId });

    return {
      items: items.map((item) => ({
        _id: String(item._id),
        userId: String(item.userId),
        postContent: item.postContent,
        postAuthor: item.postAuthor,
        postUrl: item.postUrl,
        tone: item.tone as CommentTone,
        generatedText: item.generatedText,
        tokensUsed: item.tokensUsed,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    };
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const result = await CommentHistory.findOneAndDelete({
      _id: commentId,
      userId,
    });

    if (!result) {
      throw new Error("Comment not found or unauthorized");
    }

    await activityService.log(userId, "COMMENT_DELETED", "Deleted comment from history");
  }

  async searchHistory(userId: string, query: string, limit = 20): Promise<ICommentHistoryItem[]> {
    const items = await CommentHistory.find({
      userId,
      $or: [
        { postContent: { $regex: query, $options: "i" } },
        { generatedText: { $regex: query, $options: "i" } },
        { postAuthor: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();

    return items.map((item) => ({
      _id: String(item._id),
      userId: String(item.userId),
      postContent: item.postContent,
      postAuthor: item.postAuthor,
      postUrl: item.postUrl,
      tone: item.tone as CommentTone,
      generatedText: item.generatedText,
      tokensUsed: item.tokensUsed,
      createdAt: item.createdAt.toISOString(),
    }));
  }
}

export const commentService = new CommentService();
