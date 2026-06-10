import { User } from "../models/User.model";
import type { SubscriptionPlan } from "@linkai/types";

/**
 * Rate Limit Service - Manages comment generation rate limits
 *
 * PURPOSE:
 * - Enforce daily comment generation limits based on subscription plan
 * - Calculate remaining comments for users
 * - Handle day-based reset logic
 *
 * ARCHITECTURE:
 * - Used by: commentService.generate()
 * - Depends on: User model, subscription plans
 * - Enforces: Tiered rate limiting (free/pro/premium)
 *
 * RATE LIMITS:
 * - Free: 20 comments/day
 * - Pro: 100 comments/day
 * - Premium: 999 comments/day (effectively unlimited)
 *
 * KEY IMPLEMENTATION NOTES:
 * - Daily reset happens at UTC midnight
 * - Reset date tracking in Settings.usageStats.lastResetDate
 * - Actual count maintained in Settings.usageStats.commentsGeneratedToday
 */

// Rate limit configuration by subscription tier
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
   *
   * @param plan - User's subscription plan (free, pro, premium)
   * @returns Maximum comments allowed per day
   *
   * USED BY: commentService to check limits
   */
  getCommentLimit(plan: SubscriptionPlan): number {
    return DAILY_COMMENT_LIMITS[plan] || DAILY_COMMENT_LIMITS.free;
  }

  /**
   * Calculate remaining comments for today
   *
   * LOGIC:
   * 1. Get user's subscription plan from database
   * 2. Get daily limit for that plan
   * 3. Subtract comments used today
   * 4. Return maximum of 0 or remaining
   *
   * @param userId - ID of user to check
   * @param commentsUsedToday - Number of comments generated today
   * @returns Remaining comments available (0 if limit exceeded)
   * @throws Error if user not found
   *
   * USED BY: commentService to calculate remaining quota in response
   */
  async getRemainingComments(userId: string, commentsUsedToday: number): Promise<number> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }

    const limit = this.getCommentLimit(user.subscriptionPlan);
    return Math.max(0, limit - commentsUsedToday);
  }

  /**
   * Check if it's a new day and determine if reset is needed
   *
   * LOGIC:
   * - Compare today's date with last reset date
   * - Set both to midnight UTC to ignore time component
   * - Return true if different days (reset needed)
   *
   * @param lastResetDate - Last time daily count was reset
   * @returns true if reset is needed (new day)
   *
   * USED BY: commentService.generate() to check if daily count should reset
   */
  checkIfNewDay(lastResetDate: Date): boolean {
    const today = new Date();
    const lastDate = new Date(lastResetDate);
    
    // Set both times to midnight UTC to only compare dates
    today.setUTCHours(0, 0, 0, 0);
    lastDate.setUTCHours(0, 0, 0, 0);

    return today.getTime() !== lastDate.getTime();
  }
}

export const rateLimitService = new RateLimitService();
