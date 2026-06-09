import { MessageType, type BaseMessage, type MessageResponse } from "@/types/messages";
import { debugLog, persistDebugLog } from "@/utils/debug";

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if extension context is valid
 */
function isExtensionContextValid(): boolean {
  try {
    // Accessing chrome.runtime.id will throw if context is invalid
    const extensionId = chrome.runtime.id;
    return !!extensionId;
  } catch {
    return false;
  }
}

export async function sendMessage<T = unknown>(
  message: BaseMessage,
  target: "background" | "tab" = "background"
): Promise<MessageResponse<T>> {
  const requestId = message.requestId ?? randomId();
  const payload = { ...message, requestId };

  debugLog("messaging", `send → ${message.type}`, payload);

  return new Promise((resolve) => {
    // Check if extension context is valid before sending
    if (!isExtensionContextValid()) {
      debugLog("messaging", "Extension context invalidated, request will fail", {
        type: message.type,
      });
      resolve({
        success: false,
        error:
          "Extension context invalidated. Please reload the page or restart the extension.",
      });
      return;
    }

    const callback = (response: MessageResponse<T> | undefined) => {
      // Check for extension context errors
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message || "";

        // Handle specific error cases
        if (
          errorMessage.includes("Extension context invalidated") ||
          errorMessage.includes("target page closed") ||
          errorMessage.includes("Could not establish connection")
        ) {
          debugLog("messaging", "Extension context lost", {
            error: errorMessage,
            type: message.type,
          });
          resolve({
            success: false,
            error:
              "Extension connection lost. Please reload the page or restart the extension.",
          });
          return;
        }

        // Generic error
        resolve({ success: false, error: errorMessage });
        return;
      }

      // No error, return response
      resolve(response ?? { success: false, error: "No response" });
    };

    if (target === "background") {
      try {
        chrome.runtime.sendMessage(payload, callback);
      } catch (error) {
        // Catch synchronous errors (e.g., context invalidated)
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error sending message";
        debugLog("messaging", "Error sending message to background", {
          error: errorMsg,
          type: message.type,
        });
        resolve({
          success: false,
          error:
            "Failed to send message. Extension may have been reloaded. Please refresh the page.",
        });
      }
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) {
          resolve({ success: false, error: "No active tab" });
          return;
        }
        try {
          chrome.tabs.sendMessage(tabId, payload, callback);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error sending message";
          debugLog("messaging", "Error sending message to tab", {
            error: errorMsg,
            type: message.type,
          });
          resolve({
            success: false,
            error: "Failed to send message to tab. Tab may have been closed.",
          });
        }
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
