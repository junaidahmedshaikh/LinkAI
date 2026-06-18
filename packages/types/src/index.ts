export type AuthProvider = "local" | "google" | "linkedin";

export type SubscriptionPlan = "free" | "pro" | "premium";

export type UserRole = "user" | "admin";

export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";

export interface IUserProfile {
  jobTitle?: string;
  industry?: string;
  experienceLevel?: ExperienceLevel;
  onboardingCompleted?: boolean;
}

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  emailVerified: boolean;
  profile?: IUserProfile;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  user: IUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  avatar?: string;
}

export interface OnboardingPayload {
  jobTitle: string;
  industry: string;
  experienceLevel: ExperienceLevel;
}

export * from "./phase2";
export * from "./extension";
export * from "./sync";
export * from "./ai";
