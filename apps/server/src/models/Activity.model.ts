import mongoose, { Document, Schema, Types } from "mongoose";
import type { ActivityType } from "@linkai/types";

export interface IActivityDocument extends Document {
  userId: Types.ObjectId;
  type: ActivityType;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivityDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "PROFILE_UPDATED",
        "RESUME_UPLOADED",
        "RESUME_DELETED",
        "LOGIN",
        "LOGOUT",
        "LINKEDIN_UPDATED",
        "SETTINGS_UPDATED",
        "PASSWORD_CHANGED",
        "AVATAR_UPLOADED",
        "AVATAR_DELETED",
        "EXTENSION_OPENED",
        "PAGE_VISITED",
        "LINKEDIN_PROFILE_VIEWED",
        "JOB_VIEWED",
        "FEATURE_CLICKED",
        "EXTENSION_CONNECTED",
        "EXTENSION_DISCONNECTED",
        "SESSION_REVOKED",
        "WEB_VISIT",
        "COMMENT_GENERATED",
      ],
      required: true,
    },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivityDocument>("Activity", activitySchema);
