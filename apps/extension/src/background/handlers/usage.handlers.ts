import { linkedinService } from "@/services/linkedin.service";
import { syncService } from "@/services/sync.service";
import { usageService } from "@/services/usage.service";
import type { ExtensionActivityType } from "@linkai/types";
import type { MessageResponse } from "@/types/messages";

export async function handleUsageTrack(payload: unknown): Promise<MessageResponse> {
  const { type, action, metadata } = payload as {
    type: ExtensionActivityType;
    action: string;
    metadata?: Record<string, unknown>;
  };
  await usageService.track(type, action, metadata);
  return { success: true };
}

export async function handleApiHeartbeat(): Promise<MessageResponse> {
  const state = await linkedinService.getState();
  const result = await syncService.heartbeat(state?.pageType, state?.url);
  return { success: true, data: result };
}
