import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISettingsDocument extends Document {
  userId: Types.ObjectId;
  notifications: {
    emailNotifications: boolean;
    productUpdates: boolean;
    featureAnnouncements: boolean;
    marketingEmails: boolean;
  };
  preferences: {
    theme: "dark" | "light" | "system";
    language: string;
    timezone: string;
  };
  usageStats: {
    commentsGenerated: number;
    commentsGeneratedToday?: number;
    tokensUsedTotal?: number;
    lastResetDate?: Date;
    postsRewritten: number;
    connectionRequests: number;
    applicationsTracked: number;
  };
  extensionMeta: {
    lastHeartbeatAt?: Date;
    lastVersion?: string;
    lastLinkedInPage?: string;
    lastLinkedInUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true },
      featureAnnouncements: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
    preferences: {
      theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
    },
    usageStats: {
      commentsGenerated: { type: Number, default: 0, min: 0 },
      commentsGeneratedToday: { type: Number, default: 0, min: 0 },
      tokensUsedTotal: { type: Number, default: 0, min: 0 },
      lastResetDate: { type: Date, default: () => new Date() },
      postsRewritten: { type: Number, default: 0, min: 0 },
      connectionRequests: { type: Number, default: 0, min: 0 },
      applicationsTracked: { type: Number, default: 0, min: 0 },
    },
    extensionMeta: {
      lastHeartbeatAt: { type: Date },
      lastVersion: { type: String },
      lastLinkedInPage: { type: String },
      lastLinkedInUrl: { type: String, maxlength: 500 },
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettingsDocument>("Settings", settingsSchema);
