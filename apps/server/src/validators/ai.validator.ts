import { z } from "zod";

const optionalString = (maxLength: number) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().max(maxLength).optional()
  );

const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.string().url("Post URL must be a valid http(s) URL").optional()
);

export const generateCommentSchema = z.object({
  postContent: z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(10, "Post content must be at least 10 characters")
        .max(5000, "Post content cannot exceed 5000 characters")
    ),
  postAuthor: optionalString(200),
  postUrl: optionalUrl,
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

