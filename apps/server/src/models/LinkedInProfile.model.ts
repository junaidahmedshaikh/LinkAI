import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILinkedInProfileDocument extends Document {
  userId: Types.ObjectId;
  linkedinUrl?: string;
  headline?: string;
  about?: string;
  experience: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }>;
  education: Array<{
    school?: string;
    degree?: string;
    year?: string;
  }>;
  skills: string[];
  connections?: number;
  followers?: number;
  profileScore: number;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const linkedInProfileSchema = new Schema<ILinkedInProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    linkedinUrl: { type: String, trim: true },
    headline: { type: String, trim: true, maxlength: 220 },
    about: { type: String, trim: true, maxlength: 3000 },
    experience: [
      {
        title: String,
        company: String,
        duration: String,
        description: String,
      },
    ],
    education: [
      {
        school: String,
        degree: String,
        year: String,
      },
    ],
    skills: { type: [String], default: [] },
    connections: { type: Number, min: 0 },
    followers: { type: Number, min: 0 },
    profileScore: { type: Number, default: 0, min: 0, max: 100 },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export const LinkedInProfile = mongoose.model<ILinkedInProfileDocument>(
  "LinkedInProfile",
  linkedInProfileSchema
);
