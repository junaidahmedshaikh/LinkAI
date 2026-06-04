const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID as string | undefined;

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback?: (response: unknown) => void
  ) => void;
  lastError?: { message?: string };
};

function getChromeRuntime(): ChromeRuntime | undefined {
  if (typeof window === "undefined") return undefined;
  const runtime = (window as Window & { chrome?: { runtime?: ChromeRuntime } }).chrome?.runtime;
  if (!runtime || typeof runtime.sendMessage !== "function") return undefined;
  return runtime;
}

export type ExtensionBridgeMessage =
  | { type: "AUTH_SYNC"; payload: { accessToken: string; refreshToken?: string } }
  | { type: "AUTH_LOGOUT" }
  | { type: "SYNC_REQUEST" };

export function isExtensionBridgeAvailable(): boolean {
  return !!(EXTENSION_ID && getChromeRuntime());
}

export function sendToExtension(message: ExtensionBridgeMessage): void {
  const runtime = getChromeRuntime();
  if (!EXTENSION_ID || !runtime) return;
  try {
    runtime.sendMessage(EXTENSION_ID, message, () => {
      void runtime.lastError;
    });
  } catch {
    // Extension not installed or ID mismatch
  }
}

export function syncAuthToExtension(accessToken: string, refreshToken?: string): void {
  sendToExtension({ type: "AUTH_SYNC", payload: { accessToken, refreshToken } });
}

export function notifyExtensionLogout(): void {
  sendToExtension({ type: "AUTH_LOGOUT" });
}

export function requestExtensionSync(): void {
  sendToExtension({ type: "SYNC_REQUEST" });
}
