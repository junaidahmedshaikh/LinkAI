import { AxiosError } from "axios";
import type { ApiResponse } from "@linkai/types";

type ApiErrorResponse = ApiResponse & {
  errors?: Record<string, string[]>;
};

/**
 * Extract a user-friendly message from an API or network error.
 */
export function extractApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (data?.message) {
      if (data.errors) {
        const details = Object.values(data.errors).flat().join("; ");
        return details ? `${data.message}: ${details}` : data.message;
      }
      return data.message;
    }

    if (error.response?.status === 401) {
      return "Please log in to generate comments. Click the extension icon and sign in.";
    }

    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    if (!error.response) {
      return "Cannot reach the LinkAI server. Make sure it is running and try again.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    if (/Google AI error \(401\)|invalid authentication credentials/i.test(error.message)) {
      return "AI service authentication failed on the server. Ask your admin to set a valid GOOGLE_GENERATIVE_AI_KEY in the backend .env file.";
    }
    if (/Comment generation failed:/i.test(error.message)) {
      return error.message.replace(/^Comment generation failed:\s*/i, "");
    }
    return error.message;
  }

  return fallback;
}
