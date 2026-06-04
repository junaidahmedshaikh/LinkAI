import { debugLog } from "@/utils/debug";

export type StorageArea = "local" | "sync";

const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_CACHE: "user_cache",
  SETTINGS_CACHE: "settings_cache",
  LINKEDIN_STATE: "linkedin_state",
  UI_STATE: "ui_state",
  LAST_HEARTBEAT: "last_heartbeat",
  SESSION_ID: "session_id",
  SYNC_CACHE: "sync_cache",
  FEATURE_FLAGS_CACHE: "feature_flags_cache",
  DEVICE_ID: "device_id",
  COMMENT_HISTORY: "comment_history",
} as const;

export const StorageKeys = KEYS;

class StorageService {
  private area(area: StorageArea): chrome.storage.StorageArea {
    return area === "sync" ? chrome.storage.sync : chrome.storage.local;
  }

  async get<T>(key: string, area: StorageArea = "local"): Promise<T | null> {
    const result = await this.area(area).get(key);
    return (result[key] as T) ?? null;
  }

  async set(key: string, value: unknown, area: StorageArea = "local"): Promise<void> {
    await this.area(area).set({ [key]: value });
    debugLog("storage", `set ${key}`, { area });
  }

  async remove(key: string, area: StorageArea = "local"): Promise<void> {
    await this.area(area).remove(key);
  }

  async clearAuth(): Promise<void> {
    await this.remove(KEYS.ACCESS_TOKEN);
    await this.remove(KEYS.REFRESH_TOKEN);
    await this.remove(KEYS.USER_CACHE);
    await this.remove(KEYS.SETTINGS_CACHE);
  }

  async getAccessToken(): Promise<string | null> {
    return this.get<string>(KEYS.ACCESS_TOKEN);
  }

  async setAccessToken(token: string): Promise<void> {
    await this.set(KEYS.ACCESS_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.get<string>(KEYS.REFRESH_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.set(KEYS.REFRESH_TOKEN, token);
  }
}

export const storageService = new StorageService();
