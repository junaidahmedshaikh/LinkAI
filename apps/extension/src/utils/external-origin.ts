import { getAllowedExternalOrigins } from "@/utils/config";

export function isAllowedExternalSender(sender: chrome.runtime.MessageSender): boolean {
  if (!sender.url) return false;

  try {
    const origin = new URL(sender.url).origin;
    return getAllowedExternalOrigins().includes(origin);
  } catch {
    return false;
  }
}
