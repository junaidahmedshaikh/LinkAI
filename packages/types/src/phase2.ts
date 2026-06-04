export type ActivityType =
  | "PROFILE_UPDATED"
  | "RESUME_UPLOADED"
  | "RESUME_DELETED"
  | "LOGIN"
  | "LOGOUT"
  | "LINKEDIN_UPDATED"
  | "SETTINGS_UPDATED"
  | "PASSWORD_CHANGED"
  | "AVATAR_UPLOADED"
  | "AVATAR_DELETED"
  | "EXTENSION_OPENED"
  | "PAGE_VISITED"
  | "LINKEDIN_PROFILE_VIEWED"
  | "JOB_VIEWED"
  | "FEATURE_CLICKED"
  | "EXTENSION_CONNECTED"
  | "EXTENSION_DISCONNECTED"
  | "SESSION_REVOKED"
  | "WEB_VISIT"
  | "COMMENT_GENERATED";

export interface IParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }>;
  education: Array<{
    degree?: string;
    institution?: string;
    year?: string;
  }>;
  projects: Array<{
    name?: string;
    description?: string;
  }>;
  certifications: string[];
  summary?: string;
  rawText?: string;
}

export interface IProfile {
  _id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  position?: string;
  company?: string;
  industry?: string;
  location?: string;
  experienceYears?: number;
  skills: string[];
  website?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
  avatar?: string;
  linkedinUrl?: string;
  profileScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface IResume {
  _id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  parsedData?: IParsedResumeData;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ILinkedInExperience {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
}

export interface ILinkedInEducation {
  school?: string;
  degree?: string;
  year?: string;
}

export interface ILinkedInProfile {
  _id: string;
  userId: string;
  linkedinUrl?: string;
  headline?: string;
  about?: string;
  experience: ILinkedInExperience[];
  education: ILinkedInEducation[];
  skills: string[];
  connections?: number;
  followers?: number;
  profileScore: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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
  profileCompletion: number;
  resumeUploaded: boolean;
  resumeCount: number;
  linkedinConnected: boolean;
  linkedinProfileScore: number;
  usageStats: IUsageStats;
  recentActivities: IActivity[];
  extensionStatus?: import("./sync").IExtensionStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
