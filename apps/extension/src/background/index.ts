import { MessageType, onMessage } from "@/services/messaging.service";
import type { BaseMessage, MessageResponse } from "@/types/messages";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { settingsService } from "@/services/settings.service";
import { usageService } from "@/services/usage.service";
import { linkedinService } from "@/services/linkedin.service";
import { tokenService } from "@/services/token.service";
import { syncService } from "@/services/sync.service";
import { connectionService } from "@/services/connection.service";
import { aiCommentService } from "@/services/ai-comment.service";
import { detectLinkedInPageType, isLinkedInUrl } from "@/utils/linkedin-detector";
import { persistDebugLog } from "@/utils/debug";
import { EXTENSION_VERSION, WEB_APP_URL } from "@/utils/config";
import type { LoginPayload } from "@/types/messages";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

async function initAuth(): Promise<void> {
  const authed = await authService.isAuthenticated();
  if (!authed) return;
  try {
    await authService.refreshSession();
    await connectionService.ensureConnected();
    await syncService.fetchUser().catch(() => undefined);
    await usageService.track("EXTENSION_OPENED", "Extension background started");
  } catch {
    await tokenService.clearTokens();
  }
}

function startHeartbeat(): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    if (!(await authService.isAuthenticated())) return;
    const state = await linkedinService.getState();
    try {
      await syncService.heartbeat(state?.pageType, state?.url);
    } catch {
      // offline
    }
  }, HEARTBEAT_INTERVAL_MS);
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  void persistDebugLog("background", "installed", { version: EXTENSION_VERSION });
});

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === "AUTH_SYNC") {
        const { accessToken, refreshToken } = message.payload as {
          accessToken: string;
          refreshToken?: string;
        };
        const ok = await connectionService.syncFromWeb(accessToken, refreshToken);
        startHeartbeat();
        sendResponse({ success: ok });
        return;
      }
      if (message.type === "AUTH_LOGOUT") {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url || !isLinkedInUrl(tab.url)) return;
  if (changeInfo.status === "complete" || changeInfo.url) {
    const pageType = detectLinkedInPageType(tab.url);
    void linkedinService.saveState({
      pageType,
      url: tab.url,
      updatedAt: new Date().toISOString(),
    });
    void chrome.tabs.sendMessage(tabId, {
      type: MessageType.LINKEDIN_PAGE_CHANGED,
      payload: { pageType, url: tab.url },
    }).catch(() => undefined);
  }
});

onMessage(async (message: BaseMessage): Promise<MessageResponse> => {
  switch (message.type) {
    case MessageType.PING:
      return { success: true, data: { pong: true } };

    case MessageType.AUTH_LOGIN: {
      const { email, password } = message.payload as LoginPayload;
      try {
        const user = await authService.login(email, password);
        await syncService.connect();
        startHeartbeat();
        await usageService.track("EXTENSION_OPENED", "User logged in via extension");
        return { success: true, data: { user } };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.AUTH_LOGOUT: {
      try {
        await syncService.disconnect();
      } catch {
        // continue logout
      }
      await authService.logout();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      return { success: true };
    }

    case MessageType.AUTH_SYNC_FROM_WEB: {
      const { accessToken, refreshToken } = message.payload as {
        accessToken: string;
        refreshToken?: string;
      };
      const ok = await connectionService.syncFromWeb(accessToken, refreshToken);
      if (ok) startHeartbeat();
      return { success: ok };
    }

    case MessageType.AUTH_GET_STATE: {
      const authed = await authService.isAuthenticated();
      const user = await authService.getCachedUser();
      return {
        success: true,
        data: { isAuthenticated: authed, userEmail: user?.email },
      };
    }

    case MessageType.AUTH_REFRESH: {
      try {
        const user = await authService.refreshSession();
        return { success: true, data: { user } };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.SYNC_FETCH_USER: {
      try {
        const data = await syncService.fetchUser();
        return { success: true, data };
      } catch (e) {
        const cached = await syncService.getCachedOrFetch();
        if (cached) return { success: true, data: cached };
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.SYNC_STORAGE: {
      try {
        const data = await syncService.fetchUser();
        return { success: true, data };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.API_GET_ME: {
      try {
        const me = await profileService.getExtensionMe();
        return { success: true, data: me };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.API_GET_SETTINGS: {
      try {
        const settings = await settingsService.getSettings();
        return { success: true, data: settings };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.API_LOG_ACTIVITY:
    case MessageType.USAGE_TRACK: {
      const { type, action, metadata } = message.payload as {
        type: Parameters<typeof usageService.track>[0];
        action: string;
        metadata?: Record<string, unknown>;
      };
      await usageService.track(type, action, metadata);
      return { success: true };
    }

    case MessageType.API_HEARTBEAT: {
      const state = await linkedinService.getState();
      const result = await syncService.heartbeat(state?.pageType, state?.url);
      return { success: true, data: result };
    }

    case MessageType.LINKEDIN_PAGE_CHANGED: {
      const { pageType, url } = message.payload as { pageType: string; url: string };
      await linkedinService.saveState({
        pageType: pageType as Parameters<typeof linkedinService.saveState>[0]["pageType"],
        url,
        updatedAt: new Date().toISOString(),
      });
      if (await authService.isAuthenticated()) {
        const activityType =
          pageType === "profile"
            ? "LINKEDIN_PROFILE_VIEWED"
            : pageType === "job" || pageType === "jobs"
              ? "JOB_VIEWED"
              : "PAGE_VISITED";
        await usageService.track(activityType, `Visited LinkedIn ${pageType}`, { url });
      }
      return { success: true };
    }

    case MessageType.LINKEDIN_DATA_EXTRACTED: {
      const state = await linkedinService.getState();
      if (state) {
        await linkedinService.saveState({
          ...state,
          lastExtracted: message.payload as Record<string, unknown>,
        });
      }
      return { success: true };
    }

    case MessageType.UI_OPEN_SIDE_PANEL: {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      return { success: true };
    }

    case MessageType.AI_GENERATE_COMMENT: {
      try {
        const result = await aiCommentService.generate(message.payload as Parameters<typeof aiCommentService.generate>[0]);
        await usageService.track("FEATURE_CLICKED", "Generated AI comment", {
          tone: (message.payload as { tone: string }).tone,
        });
        return { success: true, data: result };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    case MessageType.AI_GET_COMMENT_HISTORY: {
      try {
        const history = await aiCommentService.getHistory();
        return { success: true, data: { history } };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
});

void initAuth().then(startHeartbeat);

void persistDebugLog("background", "started", { webApp: WEB_APP_URL });
