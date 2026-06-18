export const API_ROUTES = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    ME: "/api/auth/me",
    PROFILE: "/api/auth/profile",
    VERIFY_EMAIL: "/api/auth/verify-email",
    GOOGLE: "/api/auth/google",
    LINKEDIN: "/api/auth/linkedin",
    ONBOARDING: "/api/users/onboarding",
  },
  SETTINGS: {
    BASE: "/api/settings",
  },
  SECURITY: {
    CHANGE_PASSWORD: "/api/security/change-password",
    LOGOUT_ALL: "/api/security/logout-all",
    SESSIONS: "/api/security/sessions",
    REVOKE_SESSION: (id: string) => `/api/security/sessions/${id}`,
  },
  DASHBOARD: {
    OVERVIEW: "/api/dashboard/overview",
  },
  EXTENSION: {
    ME: "/api/extension/me",
    ACTIVITY: "/api/extension/activity",
    SETTINGS: "/api/extension/settings",
    HEARTBEAT: "/api/extension/heartbeat",
    CONNECT: "/api/extension/connect",
    DISCONNECT: "/api/extension/disconnect",
  },
  SYNC: {
    USER: "/api/sync/user",
    SETTINGS: "/api/sync/settings",
    USAGE: "/api/sync/usage",
    PERMISSIONS: "/api/sync/permissions",
    FEATURE_FLAGS: "/api/sync/feature-flags",
    HEARTBEAT: "/api/sync/heartbeat",
  },
  AI: {
    GENERATE_COMMENT: "/api/ai/comments/generate",
    COMMENT_HISTORY: "/api/ai/comments/history",
    DELETE_COMMENT: (id: string) => `/api/ai/comments/${id}`,
    SEARCH_COMMENTS: "/api/ai/comments/search",
  },
} as const;

export const DEVICE_TYPES = ["WEB", "EXTENSION", "MOBILE_FUTURE"] as const;

export const SYNC_EVENT_TYPES = [
  "SETTINGS_UPDATED",
  "USAGE_UPDATED",
  "SESSION_REVOKED",
  "EXTENSION_CONNECTED",
  "EXTENSION_DISCONNECTED",
] as const;

export const DEFAULT_FEATURE_FLAGS = [
  { key: "AI_COMMENTS", name: "AI Comments", enabled: true, description: "AI comment generator" },
  { key: "AI_POST_REWRITER", name: "AI Post Rewriter", enabled: false, description: "Rewrite LinkedIn posts" },
  { key: "AI_EASY_APPLY", name: "AI Easy Apply", enabled: false, description: "Smart job applications" },
] as const;

export const EXTENSION_ACTIVITY_TYPES = [
  "EXTENSION_OPENED",
  "PAGE_VISITED",
  "LINKEDIN_PROFILE_VIEWED",
  "JOB_VIEWED",
  "FEATURE_CLICKED",
] as const;

export const LINKEDIN_PAGE_TYPES = [
  "feed",
  "profile",
  "company",
  "jobs",
  "job",
  "messaging",
  "post",
  "search",
  "unknown",
] as const;

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export const SUBSCRIPTION_PLANS = ["free", "pro", "premium"] as const;
export const USER_ROLES = ["user", "admin"] as const;
export const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "executive"] as const;

export const ACTIVITY_TYPES = [
  "LOGIN",
  "LOGOUT",
  "SETTINGS_UPDATED",
  "PASSWORD_CHANGED",
  "EXTENSION_OPENED",
  "PAGE_VISITED",
  "LINKEDIN_PROFILE_VIEWED",
  "JOB_VIEWED",
  "FEATURE_CLICKED",
  "EXTENSION_CONNECTED",
  "EXTENSION_DISCONNECTED",
  "SESSION_REVOKED",
  "WEB_VISIT",
  "COMMENT_GENERATED",
] as const;
