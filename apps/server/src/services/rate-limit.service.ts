import { User } from "../models/User.model";
import type { SubscriptionPlan } from "@linkai/types";

interface RateLimitConfig {
  free: number;
  pro: number;
  premium: number;
}

const DAILY_COMMENT_LIMITS: RateLimitConfig = {
  free: 20,
  pro: 100,
  premium: 999,
};

class RateLimitService {
  /**
   * Get daily comment limit for a user based on subscription plan
   */
  getCommentLimit(plan: SubscriptionPlan): number {
    return DAILY_COMMENT_LIMITS[plan] || DAILY_COMMENT_LIMITS.free;
  }

  /**
   * Check if user has exceeded daily comment limit
   */
  async hasExceededLimit(userId: string): Promise<boolean> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");

    const limit = this.getCommentLimit(user.subscriptionPlan);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This will be tracked in usageStats - check with settings service
    return false; // Will be checked in comment service with actual count
  }

  /**
   * Get remaining comments for today
   */
  async getRemainingComments(userId: string, commentsUsedToday: number): Promise<number> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");

    const limit = this.getCommentLimit(user.subscriptionPlan);
    return Math.max(0, limit - commentsUsedToday);
  }

  /**
   * Reset daily comment count at midnight
   */
  async resetDailyCount(userId: string): Promise<void> {
    // This is handled by the settings service through scheduled jobs
    // or by checking the date of the last reset
  }

  /**
   * Check if it's a new day and reset if needed
   */
  async checkAndResetIfNewDay(userId: string, lastResetDate: Date): Promise<boolean> {
    const today = new Date();
    const lastDate = new Date(lastResetDate);
    
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    return today.getTime() !== lastDate.getTime();
  }
}

export const rateLimitService = new RateLimitService();
