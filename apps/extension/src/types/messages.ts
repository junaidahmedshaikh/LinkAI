import type {
  IExtensionActivityPayload,
  IExtensionHeartbeatPayload,
  IExtensionMeResponse,
  LinkedInPageType,
} from "@linkai/types";

export enum MessageType {
  AUTH_LOGIN = "AUTH_LOGIN",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_GET_STATE = "AUTH_GET_STATE",
  AUTH_REFRESH = "AUTH_REFRESH",
  API_GET_ME = "API_GET_ME",
  API_GET_SETTINGS = "API_GET_SETTINGS",
  API_LOG_ACTIVITY = "API_LOG_ACTIVITY",
  API_HEARTBEAT = "API_HEARTBEAT",
  LINKEDIN_PAGE_CHANGED = "LINKEDIN_PAGE_CHANGED",
  LINKEDIN_DATA_EXTRACTED = "LINKEDIN_DATA_EXTRACTED",
  USAGE_TRACK = "USAGE_TRACK",
  UI_OPEN_SIDE_PANEL = "UI_OPEN_SIDE_PANEL",
  UI_TOAST = "UI_TOAST",
  DEBUG_LOG = "DEBUG_LOG",
  SYNC_STORAGE = "SYNC_STORAGE",
  SYNC_FETCH_USER = "SYNC_FETCH_USER",
  AUTH_SYNC_FROM_WEB = "AUTH_SYNC_FROM_WEB",
  LINKEDIN_EXTRACT_ACTIVE_POST = "LINKEDIN_EXTRACT_ACTIVE_POST",
  AI_GENERATE_COMMENT = "AI_GENERATE_COMMENT",
  AI_INSERT_COMMENT = "AI_INSERT_COMMENT",
  AI_GET_COMMENT_HISTORY = "AI_GET_COMMENT_HISTORY",
  PING = "PING",
}

export interface BaseMessage<T = MessageType, P = unknown> {
  type: T;
  payload?: P;
  requestId?: string;
}

export type LoginPayload = { email: string; password: string };

export type MessageResponses = {
  [MessageType.AUTH_LOGIN]: { success: boolean; error?: string };
  [MessageType.AUTH_GET_STATE]: { isAuthenticated: boolean; userEmail?: string };
  [MessageType.API_GET_ME]: IExtensionMeResponse | null;
  [MessageType.LINKEDIN_PAGE_CHANGED]: { pageType: LinkedInPageType; url: string };
  [MessageType.PING]: { pong: boolean };
};

export type ActivityTrackPayload = IExtensionActivityPayload;
export type HeartbeatPayload = IExtensionHeartbeatPayload;

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
