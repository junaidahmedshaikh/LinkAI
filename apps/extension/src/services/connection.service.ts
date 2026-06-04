import { tokenService } from "./token.service";
import { storageService, StorageKeys } from "./storage.service";
import { extensionSessionService } from "./session.service";
import { extensionCacheService } from "./cache.service";
import { syncService } from "./sync.service";
import { authService } from "./auth.service";
import { debugLog } from "@/utils/debug";

class ConnectionService {
  async syncFromWeb(accessToken: string, refreshToken?: string): Promise<boolean> {
    try {
      await tokenService.setTokens(accessToken, refreshToken);
      await syncService.connect();
      debugLog("connection", "synced auth from web");
      return true;
    } catch (e) {
      debugLog("connection", "web sync failed", e);
      return false;
    }
  }

  async handleWebLogout(): Promise<void> {
    try {
      await syncService.disconnect();
    } catch {
      // ignore
    }
    try {
      await authService.logout();
    } catch {
      // tokens may already be invalid after web logout
    }
    await storageService.clearAuth();
    await extensionSessionService.clearSession();
    await extensionCacheService.clear();
    debugLog("connection", "logged out from web signal");
  }

  async ensureConnected(): Promise<boolean> {
    if (!(await tokenService.hasValidSession())) return false;
    const sessionId = await storageService.get<string>(StorageKeys.SESSION_ID);
    if (sessionId) return true;
    try {
      await syncService.connect();
      return true;
    } catch {
      return false;
    }
  }
}

export const connectionService = new ConnectionService();
