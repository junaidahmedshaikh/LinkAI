import { logger, IS_DEV } from "./logger";

export { IS_DEV };

export function debugLog(scope: string, message: string, data?: unknown): void {
  logger.log(scope, message, data);
}

export async function persistDebugLog(
  scope: string,
  message: string,
  data?: unknown
): Promise<void> {
  debugLog(scope, message, data);
  if (!IS_DEV) return;
  try {
    const key = "debug_logs";
    const { [key]: logs = [] } = await chrome.storage.local.get(key);
    const entry = { scope, message, data, at: new Date().toISOString() };
    const next = [...(logs as unknown[]), entry].slice(-100);
    await chrome.storage.local.set({ [key]: next });
  } catch {
    // ignore storage failures in debug mode
  }
}
