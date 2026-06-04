export type CommentTone =
  | "professional"
  | "friendly"
  | "insightful"
  | "supportive"
  | "witty";

export interface IGenerateCommentRequest {
  postContent: string;
  postAuthor?: string;
  postUrl?: string;
  tone: CommentTone;
}

export interface IGeneratedComment {
  text: string;
  tone: CommentTone;
}

export interface IGenerateCommentResponse {
  comment: IGeneratedComment;
  alternatives?: IGeneratedComment[];
  usageRemaining?: number;
}

export interface ICommentHistoryItem {
  _id: string;
  userId: string;
  postContent: string;
  postAuthor?: string;
  postUrl?: string;
  tone: CommentTone;
  generatedText: string;
  createdAt: string;
}

export const COMMENT_TONES: CommentTone[] = [
  "professional",
  "friendly",
  "insightful",
  "supportive",
  "witty",
];
