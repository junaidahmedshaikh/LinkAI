import { profileService } from "@/services/profile.service";
import { settingsService } from "@/services/settings.service";
import type { MessageResponse } from "@/types/messages";

export async function handleApiGetMe(): Promise<MessageResponse> {
  try {
    const me = await profileService.getExtensionMe();
    return { success: true, data: me };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function handleApiGetSettings(): Promise<MessageResponse> {
  try {
    const settings = await settingsService.getSettings();
    return { success: true, data: settings };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
