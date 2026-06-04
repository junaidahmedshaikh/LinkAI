import mongoose, { Document, Schema, Types } from "mongoose";
import type { CommentTone } from "@linkai/types";

export interface ICommentHistoryDocument extends Document {
  userId: Types.ObjectId;
  postContent: string;
  postAuthor?: string;
  postUrl?: string;
  tone: CommentTone;
  generatedText: string;
  createdAt: Date;
}

const commentHistorySchema = new Schema<ICommentHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    postContent: { type: String, required: true, maxlength: 5000 },
    postAuthor: { type: String, maxlength: 200 },
    postUrl: { type: String, maxlength: 500 },
    tone: {
      type: String,
      enum: ["professional", "friendly", "insightful", "supportive", "witty"],
      required: true,
    },
    generatedText: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

commentHistorySchema.index({ userId: 1, createdAt: -1 });

export const CommentHistory = mongoose.model<ICommentHistoryDocument>(
  "CommentHistory",
  commentHistorySchema
);
