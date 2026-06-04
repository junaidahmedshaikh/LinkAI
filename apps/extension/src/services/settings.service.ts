import { API_ROUTES } from "@linkai/shared";
import type { ApiResponse, IUserSettings } from "@linkai/types";
import { apiClient } from "./api.client";
import { storageService, StorageKeys } from "./storage.service";

class SettingsService {
  async getSettings(): Promise<IUserSettings> {
    const { data } = await apiClient.get<ApiResponse<{ settings: IUserSettings }>>(
      API_ROUTES.EXTENSION.SETTINGS
    );
    const settings = data.data!.settings;
    await storageService.set(StorageKeys.SETTINGS_CACHE, settings);
    return settings;
  }

  async getCached(): Promise<IUserSettings | null> {
    return storageService.get<IUserSettings>(StorageKeys.SETTINGS_CACHE);
  }
}

export const settingsService = new SettingsService();
