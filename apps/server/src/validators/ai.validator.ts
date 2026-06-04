import { z } from "zod";

export const generateCommentSchema = z.object({
  postContent: z.string().min(10).max(5000),
  postAuthor: z.string().max(200).optional(),
  postUrl: z.string().max(500).optional(),
  tone: z.enum(["professional", "friendly", "insightful", "supportive", "witty"]),
});
