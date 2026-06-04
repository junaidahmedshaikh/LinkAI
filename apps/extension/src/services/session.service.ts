import { storageService, StorageKeys } from "./storage.service";

const DEVICE_ID_KEY = "device_id";

class ExtensionSessionService {
  async getDeviceId(): Promise<string> {
    let id = await storageService.get<string>(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      await storageService.set(DEVICE_ID_KEY, id);
    }
    return id;
  }

  async getSessionId(): Promise<string | null> {
    return storageService.get<string>(StorageKeys.SESSION_ID);
  }

  async setSessionId(sessionId: string): Promise<void> {
    await storageService.set(StorageKeys.SESSION_ID, sessionId);
  }

  async clearSession(): Promise<void> {
    await storageService.remove(StorageKeys.SESSION_ID);
  }
}

export const extensionSessionService = new ExtensionSessionService();
