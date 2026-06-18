export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const WEB_APP_URL =
  import.meta.env.VITE_WEB_URL || "http://localhost:5173";

export const PRIVACY_POLICY_URL =
  import.meta.env.VITE_PRIVACY_URL || `${WEB_APP_URL}/privacy`;

export const TERMS_URL =
  import.meta.env.VITE_TERMS_URL || `${WEB_APP_URL}/terms`;

export const EXTENSION_VERSION = chrome.runtime.getManifest().version;
export const IS_DEV = import.meta.env.DEV;

const LOCAL_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
];

export function getAllowedExternalOrigins(): string[] {
  const origins = new Set<string>();
  try {
    origins.add(new URL(WEB_APP_URL).origin);
  } catch {
    // ignore invalid WEB_APP_URL
  }
  if (IS_DEV) {
    LOCAL_DEV_ORIGINS.forEach((origin) => origins.add(origin));
  }
  return [...origins];
}
