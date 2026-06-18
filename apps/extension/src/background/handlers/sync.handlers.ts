import { syncService } from "@/services/sync.service";
import type { MessageResponse } from "@/types/messages";

export async function handleSyncFetchUser(): Promise<MessageResponse> {
  try {
    const data = await syncService.fetchUser();
    return { success: true, data };
  } catch (e) {
    const cached = await syncService.getCachedOrFetch();
    if (cached) return { success: true, data: cached };
    return { success: false, error: (e as Error).message };
  }
}
