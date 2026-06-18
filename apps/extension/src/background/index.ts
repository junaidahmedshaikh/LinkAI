import { MessageType, onMessage } from "@/services/messaging.service";
import { authService } from "@/services/auth.service";
import { tokenService } from "@/services/token.service";
import { syncService } from "@/services/sync.service";
import { connectionService } from "@/services/connection.service";
import { usageService } from "@/services/usage.service";
import type { BaseMessage, MessageResponse } from "@/types/messages";
import { persistDebugLog } from "@/utils/debug";
import { EXTENSION_VERSION, WEB_APP_URL } from "@/utils/config";
import { registerExternalMessageListener } from "./external-messages";
import {
  registerHeartbeatAlarmListener,
  startHeartbeat,
  stopHeartbeat,
} from "./heartbeat";
import {
  handleAuthGetState,
  handleAuthLogin,
  handleAuthLogout,
  handleAuthRefresh,
  handleAuthRegister,
  handleAuthSyncFromWeb,
} from "./handlers/auth.handlers";
import { handleGenerateComment, handleGetCommentHistory } from "./handlers/ai.handlers";
import {
  handleLinkedInDataExtracted,
  handleLinkedInPageChanged,
} from "./handlers/linkedin.handlers";
import { handleApiGetMe, handleApiGetSettings } from "./handlers/profile.handlers";
import { handleSyncFetchUser } from "./handlers/sync.handlers";
import { handleApiHeartbeat, handleUsageTrack } from "./handlers/usage.handlers";
import { handleOpenSidePanel, handlePing } from "./handlers/ui.handlers";
import type { HandlerContext } from "./handlers/types";

const handlerContext: HandlerContext = {
  startHeartbeat,
  stopHeartbeat,
};

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

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  void persistDebugLog("background", "installed", { version: EXTENSION_VERSION });
});

registerExternalMessageListener();
registerHeartbeatAlarmListener();

onMessage(async (message: BaseMessage): Promise<MessageResponse> => {
  switch (message.type) {
    case MessageType.PING:
      return handlePing();

    case MessageType.AUTH_LOGIN:
      return handleAuthLogin(message.payload, handlerContext);

    case MessageType.AUTH_REGISTER:
      return handleAuthRegister(message.payload, handlerContext);

    case MessageType.AUTH_LOGOUT:
      return handleAuthLogout(message.payload, handlerContext);

    case MessageType.AUTH_SYNC_FROM_WEB:
      return handleAuthSyncFromWeb(message.payload, handlerContext);

    case MessageType.AUTH_GET_STATE:
      return handleAuthGetState();

    case MessageType.AUTH_REFRESH:
      return handleAuthRefresh();

    case MessageType.SYNC_FETCH_USER:
    case MessageType.SYNC_STORAGE:
      return handleSyncFetchUser();

    case MessageType.API_GET_ME:
      return handleApiGetMe();

    case MessageType.API_GET_SETTINGS:
      return handleApiGetSettings();

    case MessageType.API_LOG_ACTIVITY:
    case MessageType.USAGE_TRACK:
      return handleUsageTrack(message.payload);

    case MessageType.API_HEARTBEAT:
      return handleApiHeartbeat();

    case MessageType.LINKEDIN_PAGE_CHANGED:
      return handleLinkedInPageChanged(message.payload);

    case MessageType.LINKEDIN_DATA_EXTRACTED:
      return handleLinkedInDataExtracted(message.payload);

    case MessageType.UI_OPEN_SIDE_PANEL:
      return handleOpenSidePanel();

    case MessageType.AI_GENERATE_COMMENT:
      return handleGenerateComment(message.payload, "panel");

    case MessageType.LINKEDIN_GENERATE_COMMENT:
      return handleGenerateComment(message.payload, "inline");

    case MessageType.AI_GET_COMMENT_HISTORY:
      return handleGetCommentHistory();

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
});

void initAuth().then(startHeartbeat);
void persistDebugLog("background", "started", { webApp: WEB_APP_URL });
