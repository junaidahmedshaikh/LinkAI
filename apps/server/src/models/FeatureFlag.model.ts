import mongoose, { Document, Schema } from "mongoose";

export interface IFeatureFlagDocument extends Document {
  name: string;
  key: string;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlagDocument>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, uppercase: true },
    enabled: { type: Boolean, default: false },
    description: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

export const FeatureFlag = mongoose.model<IFeatureFlagDocument>("FeatureFlag", featureFlagSchema);
