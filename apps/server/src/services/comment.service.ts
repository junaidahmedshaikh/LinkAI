import { CommentHistory } from "../models/CommentHistory.model";
import { Profile } from "../models/Profile.model";
import { aiProviderService } from "./ai-provider.service";
import { settingsService } from "./settings.service";
import { activityService } from "./activity.service";
import { featureFlagService } from "./feature-flag.service";
import { userContextService } from "./sync.service";
import { eventService } from "./event.service";
import type {
  CommentTone,
  ICommentHistoryItem,
  IGenerateCommentRequest,
  IGenerateCommentResponse,
} from "@linkai/types";

const FREE_DAILY_LIMIT = 20;

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

    const postContent = payload.postContent?.trim();
    if (!postContent || postContent.length < 10) {
      throw new Error("Post content is too short to generate a comment");
    }

    const settings = await settingsService.getOrCreate(userId);
    if (settings.usageStats.commentsGenerated >= FREE_DAILY_LIMIT * 100) {
      throw new Error("Comment generation limit reached");
    }

    const profile = await Profile.findOne({ userId }).lean();
    const userName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : undefined;

    const comment = await aiProviderService.generateComment(postContent, payload.tone, {
      author: payload.postAuthor,
      userName: userName || undefined,
      userHeadline: profile?.headline,
    });

    await CommentHistory.create({
      userId,
      postContent: postContent.slice(0, 5000),
      postAuthor: payload.postAuthor,
      postUrl: payload.postUrl,
      tone: payload.tone,
      generatedText: comment.text,
    });

    settings.usageStats.commentsGenerated += 1;
    await settings.save({ validateBeforeSave: false });
    userContextService.invalidateUser(userId);
    eventService.emit(userId, "USAGE_UPDATED");

    await activityService.log(userId, "COMMENT_GENERATED", `Generated ${payload.tone} comment`, {
      tone: payload.tone,
      postUrl: payload.postUrl,
    });

    return { comment };
  }

  async getHistory(userId: string, limit = 20): Promise<ICommentHistoryItem[]> {
    const items = await CommentHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean();

    return items.map((item) => ({
      _id: String(item._id),
      userId: String(item.userId),
      postContent: item.postContent,
      postAuthor: item.postAuthor,
      postUrl: item.postUrl,
      tone: item.tone as CommentTone,
      generatedText: item.generatedText,
      createdAt: item.createdAt.toISOString(),
    }));
  }
}

export const commentService = new CommentService();
