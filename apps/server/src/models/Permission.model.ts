import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPermissionDocument extends Document {
  userId: Types.ObjectId;
  permissions: string[];
  featureAccess: string[];
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermissionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    featureAccess: { type: [String], default: [] },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

export const Permission = mongoose.model<IPermissionDocument>("Permission", permissionSchema);
