import type { CommentTone, IGenerateCommentRequest } from "@linkai/types";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize comment generation payload before sending to the API.
 */
export function sanitizeGeneratePayload(
  payload: IGenerateCommentRequest
): IGenerateCommentRequest {
  const postContent = payload.postContent?.replace(/\s+/g, " ").trim() ?? "";

  const sanitized: IGenerateCommentRequest = {
    postContent,
    tone: payload.tone as CommentTone,
  };

  const postAuthor = payload.postAuthor?.trim();
  if (postAuthor) {
    sanitized.postAuthor = postAuthor.slice(0, 200);
  }

  const postUrl = payload.postUrl?.trim();
  if (postUrl && isValidUrl(postUrl)) {
    sanitized.postUrl = postUrl;
  }

  return sanitized;
}
