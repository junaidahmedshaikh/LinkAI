import mongoose, { Document, Schema, Types } from "mongoose";
import type { AuditAction } from "@linkai/types";

export interface IAuditDocument extends Document {
  userId: Types.ObjectId;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditSchema = new Schema<IAuditDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "PASSWORD_CHANGE",
        "PROFILE_UPDATE",
        "RESUME_UPLOAD",
        "EXTENSION_CONNECTED",
        "EXTENSION_DISCONNECTED",
        "SETTINGS_CHANGED",
        "SESSION_REVOKED",
      ],
      required: true,
    },
    resource: { type: String, maxlength: 200 },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditSchema.index({ userId: 1, createdAt: -1 });

export const Audit = mongoose.model<IAuditDocument>("Audit", auditSchema);
