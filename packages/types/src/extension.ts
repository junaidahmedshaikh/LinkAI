import type { IUser } from "./index";
import type { IUserSettings, IUsageStats } from "./phase2";

export type ExtensionActivityType =
  | "EXTENSION_OPENED"
  | "PAGE_VISITED"
  | "LINKEDIN_PROFILE_VIEWED"
  | "JOB_VIEWED"
  | "FEATURE_CLICKED";

export type LinkedInPageType =
  | "feed"
  | "profile"
  | "company"
  | "jobs"
  | "job"
  | "messaging"
  | "post"
  | "search"
  | "unknown";

export interface IExtensionMeResponse {
  user: IUser;
  usageStats: IUsageStats;
  profileCompletion: number;
  linkedinConnected: boolean;
}

export interface IExtensionHeartbeatPayload {
  extensionVersion?: string;
  linkedInPage?: LinkedInPageType;
  linkedInUrl?: string;
}

export interface IExtensionHeartbeatResponse {
  ok: boolean;
  serverTime: string;
  user: Pick<IUser, "_id" | "fullName" | "email" | "subscriptionPlan">;
  settings: IUserSettings["notifications"] & IUserSettings["preferences"];
}

export interface IExtensionActivityPayload {
  type: ExtensionActivityType;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface ILinkedInProfileExtract {
  url: string;
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  extractedAt: string;
}

export interface ILinkedInPostExtract {
  url: string;
  author?: string;
  content?: string;
  postId?: string;
  extractedAt: string;
}

export interface ILinkedInJobExtract {
  url: string;
  title?: string;
  company?: string;
  location?: string;
  extractedAt: string;
}

export interface ILinkedInCompanyExtract {
  url: string;
  name?: string;
  industry?: string;
  extractedAt: string;
}
