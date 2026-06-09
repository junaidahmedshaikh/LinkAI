export type CommentTone =
  | "professional"
  | "thought-leadership"
  | "friendly"
  | "networking"
  | "industry-expert"
  | "funny";

export interface IGenerateCommentRequest {
  postContent: string;
  postAuthor?: string;
  postUrl?: string;
  tone: CommentTone;
}

export interface IGeneratedComment {
  text: string;
  tone: CommentTone;
  tokensUsed?: number;
}

export interface IGenerateCommentResponse {
  comment: IGeneratedComment;
  alternatives?: IGeneratedComment[];
  usageRemaining?: number;
  dailyRemaining?: number;
}

export interface ICommentHistoryItem {
  _id: string;
  userId: string;
  postContent: string;
  postAuthor?: string;
  postUrl?: string;
  tone: CommentTone;
  generatedText: string;
  tokensUsed?: number;
  createdAt: string;
}

export const COMMENT_TONES: CommentTone[] = [
  "professional",
  "thought-leadership",
  "friendly",
  "networking",
  "industry-expert",
  "funny",
];
