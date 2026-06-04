import { Activity, IActivityDocument } from "../models/Activity.model";
import type { ActivityType, PaginatedResponse, IActivity } from "@linkai/types";

class ActivityService {
  async log(
    userId: string,
    type: ActivityType,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<IActivityDocument> {
    return Activity.create({ userId, type, action, metadata });
  }

  async getPaginated(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<IActivity>> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Activity.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Activity.countDocuments({ userId }),
    ]);

    return {
      items: items.map((a) => this.serialize(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getRecent(userId: string, limit = 10): Promise<IActivity[]> {
    const items = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return items.map((a) => this.serialize(a));
  }

  serialize(doc: Record<string, unknown>): IActivity {
    return {
      _id: String(doc._id),
      userId: String(doc.userId),
      type: doc.type as ActivityType,
      action: doc.action as string,
      metadata: doc.metadata as Record<string, unknown> | undefined,
      createdAt: (doc.createdAt as Date).toISOString(),
    };
  }
}

export const activityService = new ActivityService();
