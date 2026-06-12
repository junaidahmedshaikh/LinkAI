import type { IUserSettings, IUsageStats } from "./phase2";
import type { IUser } from "./index";

export type DeviceType = "WEB" | "EXTENSION" | "MOBILE_FUTURE";

export type SyncEventType =
  | "SETTINGS_UPDATED"
  | "USAGE_UPDATED"
  | "SESSION_REVOKED"
  | "EXTENSION_CONNECTED"
  | "EXTENSION_DISCONNECTED";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "EXTENSION_CONNECTED"
  | "EXTENSION_DISCONNECTED"
  | "SETTINGS_CHANGED"
  | "SESSION_REVOKED";

export type AnalyticsSource = "WEB" | "EXTENSION" | "SYSTEM";

export type AnalyticsEventType =
  | "WEB_VISIT"
  | "EXTENSION_OPEN"
  | "JOB_VIEWED"
  | "LINKEDIN_PROFILE_VIEWED"
  | "FEATURE_CLICKED";

export interface IFeatureFlag {
  _id: string;
  name: string;
  key: string;
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserPermission {
  _id: string;
  userId: string;
  permissions: string[];
  featureAccess: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface IAnalyticsEvent {
  _id: string;
  userId: string;
  source: AnalyticsSource;
  eventType: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ISessionDevice {
  _id: string;
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  browser?: string;
  ipAddress?: string;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IExtensionConnectPayload {
  deviceId: string;
  extensionVersion?: string;
  browser?: string;
}

export interface IExtensionConnectResponse {
  sessionId: string;
  user: IUser;
  settings: IUserSettings;
  usage: IUsageStats;
  permissions: IUserPermission;
  featureFlags: IFeatureFlag[];
  syncVersion: string;
  serverTime: string;
}

export interface ISyncUserResponse {
  user: IUser;
  settings: IUserSettings;
  usage: IUsageStats;
  permissions: IUserPermission;
  featureFlags: IFeatureFlag[];
  extensionStatus: IExtensionStatus;
  syncVersion: string;
  serverTime: string;
}

export interface IExtensionStatus {
  connected: boolean;
  lastHeartbeatAt?: string;
  lastVersion?: string;
  lastLinkedInPage?: string;
  lastLinkedInUrl?: string;
  activeSessionId?: string;
}

export interface ISyncHeartbeatPayload {
  deviceId: string;
  extensionVersion?: string;
  linkedInPage?: string;
  linkedInUrl?: string;
}

export interface ISyncHeartbeatResponse {
  ok: boolean;
  serverTime: string;
  syncVersion: string;
  extensionStatus: IExtensionStatus;
}
