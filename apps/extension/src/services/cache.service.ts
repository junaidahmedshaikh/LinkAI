import { storageService, StorageKeys } from "./storage.service";
import type { IExtensionConnectResponse, ISyncUserResponse } from "@linkai/types";

class ExtensionCacheService {
  async setSyncUser(data: ISyncUserResponse | IExtensionConnectResponse): Promise<void> {
    await storageService.set(StorageKeys.SYNC_CACHE, {
      ...data,
      cachedAt: new Date().toISOString(),
    });
  }

  async getSyncUser(): Promise<(ISyncUserResponse & { cachedAt?: string }) | null> {
    return storageService.get(StorageKeys.SYNC_CACHE);
  }

  async clear(): Promise<void> {
    await storageService.remove(StorageKeys.SYNC_CACHE);
    await storageService.remove(StorageKeys.FEATURE_FLAGS_CACHE);
  }
}

export const extensionCacheService = new ExtensionCacheService();
