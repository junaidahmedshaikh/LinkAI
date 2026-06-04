import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProfileDocument extends Document {
  userId: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  headline?: string;
  position?: string;
  company?: string;
  industry?: string;
  location?: string;
  experienceYears?: number;
  skills: string[];
  website?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
  avatar?: string;
  linkedinUrl?: string;
  profileScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    firstName: { type: String, trim: true, maxlength: 60 },
    lastName: { type: String, trim: true, maxlength: 60 },
    headline: { type: String, trim: true, maxlength: 220 },
    position: { type: String, trim: true, maxlength: 120 },
    company: { type: String, trim: true, maxlength: 120 },
    industry: { type: String, trim: true, maxlength: 80 },
    location: { type: String, trim: true, maxlength: 120 },
    experienceYears: { type: Number, min: 0, max: 70 },
    skills: { type: [String], default: [] },
    website: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 2000 },
    avatar: { type: String },
    linkedinUrl: { type: String, trim: true },
    profileScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfileDocument>("Profile", profileSchema);
