export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const WEB_APP_URL =
  import.meta.env.VITE_WEB_URL || "http://localhost:5173";

export const EXTENSION_VERSION = chrome.runtime.getManifest().version;
export const IS_DEV = import.meta.env.DEV;
