import { connectionService } from "@/services/connection.service";
import { syncService } from "@/services/sync.service";
import { isAllowedExternalSender } from "@/utils/external-origin";
import { logger } from "@/utils/logger";
import { startHeartbeat, stopHeartbeat } from "./heartbeat";

interface ExternalAuthSyncPayload {
  accessToken: string;
  refreshToken?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAuthSyncPayload(payload: unknown): ExternalAuthSyncPayload | null {
  if (!isRecord(payload)) return null;
  const accessToken = payload.accessToken;
  if (typeof accessToken !== "string" || accessToken.length < 10) return null;
  const refreshToken =
    typeof payload.refreshToken === "string" ? payload.refreshToken : undefined;
  return { accessToken, refreshToken };
}

export function registerExternalMessageListener(): void {
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    void (async () => {
      try {
        if (!isAllowedExternalSender(sender)) {
          logger.warn("external", "Rejected message from unauthorized origin", {
            url: sender.url,
          });
          sendResponse({ success: false, error: "Unauthorized origin" });
          return;
        }

        if (!isRecord(message) || typeof message.type !== "string") {
          sendResponse({ success: false, error: "Malformed message" });
          return;
        }

        if (message.type === "AUTH_SYNC") {
          const payload = parseAuthSyncPayload(message.payload);
          if (!payload) {
            sendResponse({ success: false, error: "Invalid auth payload" });
            return;
          }
          const ok = await connectionService.syncFromWeb(
            payload.accessToken,
            payload.refreshToken
          );
          if (ok) startHeartbeat();
          sendResponse({ success: ok });
          return;
        }

        if (message.type === "AUTH_LOGOUT") {
          stopHeartbeat();
          await connectionService.handleWebLogout();
          sendResponse({ success: true });
          return;
        }

        if (message.type === "SYNC_REQUEST") {
          const data = await syncService.fetchUser();
          sendResponse({ success: true, data });
          return;
        }

        sendResponse({ success: false, error: "Unknown external message" });
      } catch (e) {
        sendResponse({ success: false, error: (e as Error).message });
      }
    })();
    return true;
  });
}
