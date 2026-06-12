import mongoose, { Document, Schema, Types } from "mongoose";
import type { AnalyticsEventType, AnalyticsSource } from "@linkai/types";

export interface IAnalyticsDocument extends Document {
  userId: Types.ObjectId;
  source: AnalyticsSource;
  eventType: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const analyticsSchema = new Schema<IAnalyticsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    source: { type: String, enum: ["WEB", "EXTENSION", "SYSTEM"], required: true },
    eventType: {
      type: String,
      enum: [
        "WEB_VISIT",
        "EXTENSION_OPEN",
        "JOB_VIEWED",
        "LINKEDIN_PROFILE_VIEWED",
        "FEATURE_CLICKED",
      ],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ eventType: 1, createdAt: -1 });

export const Analytics = mongoose.model<IAnalyticsDocument>("Analytics", analyticsSchema);
