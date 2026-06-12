/** In dev, use Vite proxy (same origin). In prod, use VITE_API_URL. */
export const API_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.length > 0
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? ""
      : "http://localhost:5000";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  COMMENTS: "/dashboard/comments",
  SETTINGS: "/dashboard/settings",
  ADMIN: "/dashboard/admin",
} as const;

export function assetUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${path}`;
}
