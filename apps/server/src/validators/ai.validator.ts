import { z } from "zod";

export const generateCommentSchema = z.object({
  postContent: z
    .string()
    .min(10, "Post content must be at least 10 characters")
    .max(5000, "Post content cannot exceed 5000 characters"),
  postAuthor: z.string().max(200).optional(),
  postUrl: z.string().url().optional(),
  tone: z.enum(
    ["professional", "thought-leadership", "friendly", "networking", "industry-expert", "funny"],
    {
      errorMap: () => ({
        message:
          "Tone must be one of: professional, thought-leadership, friendly, networking, industry-expert, funny",
      }),
    }
  ),
});

export type GenerateCommentRequest = z.infer<typeof generateCommentSchema>;

