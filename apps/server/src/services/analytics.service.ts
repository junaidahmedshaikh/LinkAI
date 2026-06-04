import { Analytics } from "../models/Analytics.model";
import type { AnalyticsEventType, AnalyticsSource, IAnalyticsEvent } from "@linkai/types";

class AnalyticsService {
  async track(
    userId: string,
    source: AnalyticsSource,
    eventType: AnalyticsEventType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await Analytics.create({ userId, source, eventType, metadata });
  }

  async getRecent(userId: string, limit = 20): Promise<IAnalyticsEvent[]> {
    const events = await Analytics.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    return events.map((e) => ({
      _id: String(e._id),
      userId: String(e.userId),
      source: e.source,
      eventType: e.eventType,
      metadata: e.metadata as Record<string, unknown> | undefined,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}

export const analyticsService = new AnalyticsService();
