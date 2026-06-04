import mongoose, { Document, Schema, Types } from "mongoose";
import type { IParsedResumeData } from "@linkai/types";

export interface IResumeDocument extends Document {
  userId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  parsedData?: IParsedResumeData;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const parsedDataSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    skills: [String],
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
        degree: String,
        institution: String,
        year: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
      },
    ],
    certifications: [String],
    summary: String,
    rawText: String,
  },
  { _id: false }
);

const resumeSchema = new Schema<IResumeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    parsedData: parsedDataSchema,
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, isPrimary: 1 });
resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = mongoose.model<IResumeDocument>("Resume", resumeSchema);
