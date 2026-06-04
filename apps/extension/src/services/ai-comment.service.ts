import { API_ROUTES } from "@linkai/shared";
import type {
  ApiResponse,
  CommentTone,
  ICommentHistoryItem,
  IGenerateCommentRequest,
  IGenerateCommentResponse,
} from "@linkai/types";
import { apiClient } from "./api.client";
import { storageService, StorageKeys } from "./storage.service";

class AiCommentService {
  async generate(payload: IGenerateCommentRequest): Promise<IGenerateCommentResponse> {
    const { data } = await apiClient.post<ApiResponse<IGenerateCommentResponse>>(
      API_ROUTES.AI.GENERATE_COMMENT,
      payload
    );
    const result = data.data!;
    await this.prependLocalHistory({
      _id: `local-${Date.now()}`,
      userId: "",
      postContent: payload.postContent,
      postAuthor: payload.postAuthor,
      postUrl: payload.postUrl,
      tone: payload.tone,
      generatedText: result.comment.text,
      createdAt: new Date().toISOString(),
    });
    return result;
  }

  async getHistory(limit = 10): Promise<ICommentHistoryItem[]> {
    try {
      const { data } = await apiClient.get<ApiResponse<{ history: ICommentHistoryItem[] }>>(
        API_ROUTES.AI.COMMENT_HISTORY,
        { params: { limit } }
      );
      const history = data.data?.history ?? [];
      await storageService.set(StorageKeys.COMMENT_HISTORY, history);
      return history;
    } catch {
      return (await storageService.get<ICommentHistoryItem[]>(StorageKeys.COMMENT_HISTORY)) ?? [];
    }
  }

  async getLocalHistory(): Promise<ICommentHistoryItem[]> {
    return (await storageService.get<ICommentHistoryItem[]>(StorageKeys.COMMENT_HISTORY)) ?? [];
  }

  private async prependLocalHistory(item: ICommentHistoryItem): Promise<void> {
    const existing = await this.getLocalHistory();
    await storageService.set(StorageKeys.COMMENT_HISTORY, [item, ...existing].slice(0, 30));
  }
}

export const aiCommentService = new AiCommentService();

export type { CommentTone };
