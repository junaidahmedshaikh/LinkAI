import { aiCommentService } from "@/services/ai-comment.service";
import { usageService } from "@/services/usage.service";
import type { GenerateCommentPayload } from "@/types/messages";
import type { MessageResponse } from "@/types/messages";
import type { IGenerateCommentRequest } from "@linkai/types";

export async function handleGenerateComment(
  payload: unknown,
  source: "panel" | "inline"
): Promise<MessageResponse> {
  try {
    const request = payload as IGenerateCommentRequest;
    const result = await aiCommentService.generate(request);
    await usageService.track(
      "FEATURE_CLICKED",
      source === "inline"
        ? "Generated AI comment from LinkedIn editor"
        : "Generated AI comment from side panel",
      { tone: (payload as GenerateCommentPayload).tone }
    );
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function handleGetCommentHistory(): Promise<MessageResponse> {
  try {
    const history = await aiCommentService.getHistory();
    return { success: true, data: { history } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
