/**
 * Comment Generator
 * Handles comment generation API calls and state management
 * Communicates with backend service
 */

import { sendMessage, MessageType } from "@/services/messaging.service";
import type { IGeneratedComment } from "@linkai/types";
import { persistDebugLog } from "@/utils/debug";

export interface GenerationRequest {
  postContent: string;
  tone: "professional" | "thought-leadership" | "friendly" | "networking" | "industry-expert" | "funny";
  postUrl?: string;
  authorName?: string;
}

export interface GenerationResult {
  success: boolean;
  comment?: IGeneratedComment;
  error?: string;
}

class CommentGenerator {
  private isGenerating = false;

  /**
   * Generate AI comment
   */
  async generateComment(request: GenerationRequest): Promise<GenerationResult> {
    if (this.isGenerating) {
      return {
        success: false,
        error: "Generation already in progress",
      };
    }

    // Check if user is authenticated
    try {
      const authResponse = await sendMessage(
        { type: MessageType.AUTH_GET_STATE, payload: {} },
        "background"
      );

      if (!authResponse.success) {
        return {
          success: false,
          error: "Failed to check authentication",
        };
      }

      const isAuthenticated = (authResponse.data as { isAuthenticated: boolean })?.isAuthenticated;

      if (!isAuthenticated) {
        return {
          success: false,
          error: "Please log in to generate comments. Click the extension icon and sign in.",
        };
      }
    } catch {
      return {
        success: false,
        error: "Failed to verify authentication",
      };
    }

    this.isGenerating = true;

    try {
      void persistDebugLog("comment-generator", "Starting comment generation", {
        tone: request.tone,
      });

      // Send message to background script
      const response = await sendMessage<{ comment: IGeneratedComment }>(
        {
          type: MessageType.LINKEDIN_GENERATE_COMMENT,
          payload: {
            postContent: request.postContent,
            tone: request.tone,
            postUrl: request.postUrl,
            postAuthor: request.authorName,
          },
        },
        "background"
      );

      if (!response.success) {
        const error = response.error || "Failed to generate comment";
        void persistDebugLog("comment-generator", "Generation failed", { error });

        return {
          success: false,
          error,
        };
      }

      if (!response.data?.comment) {
        return {
          success: false,
          error: "No comment in response",
        };
      }

      void persistDebugLog("comment-generator", "Generation successful", {
        charCount: response.data.comment.text.length,
      });

      return {
        success: true,
        comment: response.data.comment,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      void persistDebugLog("comment-generator", "Generation error", {
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Check if generation is currently in progress
   */
  isProcessing(): boolean {
    return this.isGenerating;
  }
}

export const commentGenerator = new CommentGenerator();
