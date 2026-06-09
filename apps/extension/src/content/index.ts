import { MessageType, sendMessage } from "@/services/messaging.service";
import { detectLinkedInPageType } from "@/utils/linkedin-detector";
import { extractForCurrentPage } from "@/utils/linkedin-extractors";
import { extractActivePost } from "@/utils/linkedin-post";
import { insertCommentText } from "@/utils/comment-insert";
import { persistDebugLog } from "@/utils/debug";
import { linkedInCommentHandler } from "./linkedin-comment-handler";
import type { MessageResponse } from "@/types/messages";

let lastUrl = location.href;
let observer: MutationObserver | null = null;

function notifyPageChange(url: string): void {
  const pageType = detectLinkedInPageType(url);
  void sendMessage({
    type: MessageType.LINKEDIN_PAGE_CHANGED,
    payload: { pageType, url },
  });
  void persistDebugLog("content", `page: ${pageType}`, { url });

  // Start/stop AI comment handler based on page type
  if (pageType === "feed" || pageType === "post") {
    linkedInCommentHandler.start();
  } else {
    linkedInCommentHandler.stop();
  }
}

function runExtraction(): void {
  const pageType = detectLinkedInPageType(window.location.href);
  let payload: Record<string, unknown>;

  if (pageType === "feed" || pageType === "post") {
    const activePost = extractActivePost();
    payload = activePost
      ? { pageType, data: activePost, activePost }
      : extractForCurrentPage();
  } else {
    payload = extractForCurrentPage();
  }

  void sendMessage({
    type: MessageType.LINKEDIN_DATA_EXTRACTED,
    payload,
  });
}

function checkUrlChange(): void {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  notifyPageChange(lastUrl);
  setTimeout(runExtraction, 1200);
}

function setupUrlWatcher(): void {
  window.addEventListener("popstate", checkUrlChange);
  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);
  history.pushState = (...args) => {
    pushState(...args);
    checkUrlChange();
  };
  history.replaceState = (...args) => {
    replaceState(...args);
    checkUrlChange();
  };
  setInterval(checkUrlChange, 1000);
}

function setupMutationObserver(): void {
  if (observer) observer.disconnect();
  let debounce: ReturnType<typeof setTimeout> | null = null;
  observer = new MutationObserver(() => {
    if (document.visibilityState !== "visible") return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(runExtraction, 800);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    const type = message?.type as string;
    let response: MessageResponse;

    if (type === MessageType.LINKEDIN_EXTRACT_ACTIVE_POST) {
      const post = extractActivePost();
      response = { success: true, data: { post } };
    } else if (type === MessageType.AI_INSERT_COMMENT) {
      const text = (message.payload as { text: string })?.text ?? "";
      const inserted = insertCommentText(text);
      response = { success: inserted, data: { inserted }, error: inserted ? undefined : "Comment box not found" };
    } else {
      return;
    }

    sendResponse(response);
  })();
  return true;
});

function init(): void {
  notifyPageChange(location.href);
  setupUrlWatcher();
  setupMutationObserver();
  setTimeout(runExtraction, 2000);
  void persistDebugLog("content", "content script ready");
}

init();
