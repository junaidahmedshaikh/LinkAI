import { MessageType, type BaseMessage, type MessageResponse } from "@/types/messages";
import { debugLog, persistDebugLog } from "@/utils/debug";

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function sendMessage<T = unknown>(
  message: BaseMessage,
  target: "background" | "tab" = "background"
): Promise<MessageResponse<T>> {
  const requestId = message.requestId ?? randomId();
  const payload = { ...message, requestId };

  debugLog("messaging", `send → ${message.type}`, payload);

  return new Promise((resolve) => {
    const callback = (response: MessageResponse<T> | undefined) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { success: false, error: "No response" });
    };

    if (target === "background") {
      chrome.runtime.sendMessage(payload, callback);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) {
          resolve({ success: false, error: "No active tab" });
          return;
        }
        chrome.tabs.sendMessage(tabId, payload, callback);
      });
    }
  });
}

export function onMessage(
  handler: (
    message: BaseMessage,
    sender: chrome.runtime.MessageSender
  ) => Promise<MessageResponse> | MessageResponse
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void persistDebugLog("messaging", `recv ← ${message.type}`, { from: sender.tab?.id });
    Promise.resolve(handler(message as BaseMessage, sender))
      .then(sendResponse)
      .catch((err: Error) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  });
}

export { MessageType };
