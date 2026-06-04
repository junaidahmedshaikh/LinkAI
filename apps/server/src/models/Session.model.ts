import mongoose, { Document, Schema, Types } from "mongoose";
import type { DeviceType } from "@linkai/types";

export interface ISessionDocument extends Document {
  userId: Types.ObjectId;
  deviceId: string;
  deviceType: DeviceType;
  browser?: string;
  ipAddress?: string;
  userAgent?: string;
  refreshTokenHash?: string;
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    deviceType: {
      type: String,
      enum: ["WEB", "EXTENSION", "MOBILE_FUTURE"],
      required: true,
    },
    browser: { type: String, maxlength: 200 },
    ipAddress: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 500 },
    refreshTokenHash: { type: String, select: false },
    isActive: { type: Boolean, default: true, index: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
sessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = mongoose.model<ISessionDocument>("Session", sessionSchema);
