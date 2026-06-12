export type ActivityType =
  | "LOGIN"
  | "LOGOUT"
  | "SETTINGS_UPDATED"
  | "PASSWORD_CHANGED"
  | "EXTENSION_OPENED"
  | "PAGE_VISITED"
  | "LINKEDIN_PROFILE_VIEWED"
  | "JOB_VIEWED"
  | "FEATURE_CLICKED"
  | "EXTENSION_CONNECTED"
  | "EXTENSION_DISCONNECTED"
  | "SESSION_REVOKED"
  | "WEB_VISIT"
  | "COMMENT_GENERATED"
  | "COMMENT_DELETED";

export interface IActivity {
  _id: string;
  userId: string;
  type: ActivityType;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface INotificationPreferences {
  emailNotifications: boolean;
  productUpdates: boolean;
  featureAnnouncements: boolean;
  marketingEmails: boolean;
}

export interface IUserPreferences {
  theme: "dark" | "light" | "system";
  language: string;
  timezone: string;
}

export interface IUsageStats {
  commentsGenerated: number;
  commentsGeneratedToday?: number;
  tokensUsedTotal?: number;
  lastResetDate?: string | Date;
  postsRewritten: number;
  connectionRequests: number;
  applicationsTracked: number;
}

export interface IUserSettings {
  _id: string;
  userId: string;
  notifications: INotificationPreferences;
  preferences: IUserPreferences;
  usageStats: IUsageStats;
  createdAt: string;
  updatedAt: string;
}

export interface ISession {
  _id: string;
  userId: string;
  deviceId?: string;
  deviceType?: import("./sync").DeviceType;
  browser?: string;
  ipAddress?: string;
  ip?: string;
  userAgent?: string;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IDashboardOverview {
  usageStats: IUsageStats;
  extensionStatus?: import("./sync").IExtensionStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
