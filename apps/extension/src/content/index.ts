import { MessageType, sendMessage } from "@/services/messaging.service";
import { detectLinkedInPageType } from "@/utils/linkedin-detector";
import { extractForCurrentPage } from "@/utils/linkedin-extractors";
import { extractActivePost } from "@/utils/linkedin-post";
import { insertCommentText } from "@/content/utils/prosemirror-insert";
import { persistDebugLog } from "@/utils/debug";
import { linkedInCommentHandler } from "./linkedin-comment-handler";
import type { MessageResponse } from "@/types/messages";

const EXTRACTION_DEBOUNCE_MS = 2500;
const INITIAL_EXTRACTION_DELAY_MS = 2000;

let lastUrl = location.href;
let observer: MutationObserver | null = null;
let extractionDebounce: ReturnType<typeof setTimeout> | null = null;
let lastExtractionSignature = "";

function findObservationRoot(): Element {
  return (
    document.querySelector(
      ".scaffold-finite-scroll__content, main.scaffold-layout__main, #main-content"
    ) ?? document.body
  );
}

function notifyPageChange(url: string): void {
  const pageType = detectLinkedInPageType(url);
  void sendMessage({
    type: MessageType.LINKEDIN_PAGE_CHANGED,
    payload: { pageType, url },
  });
  void persistDebugLog("content", `page: ${pageType}`, { url });

  if (pageType === "feed" || pageType === "post") {
    linkedInCommentHandler.start();
  } else {
    linkedInCommentHandler.stop();
  }
}

function runExtraction(): void {
  if (document.visibilityState !== "visible") return;

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

  const signature = JSON.stringify(payload);
  if (signature === lastExtractionSignature) return;
  lastExtractionSignature = signature;

  void sendMessage({
    type: MessageType.LINKEDIN_DATA_EXTRACTED,
    payload,
  });
}

function scheduleExtraction(delay = EXTRACTION_DEBOUNCE_MS): void {
  if (document.visibilityState !== "visible") return;
  if (extractionDebounce) clearTimeout(extractionDebounce);
  extractionDebounce = setTimeout(runExtraction, delay);
}

function checkUrlChange(): void {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  lastExtractionSignature = "";
  notifyPageChange(lastUrl);
  scheduleExtraction(EXTRACTION_DEBOUNCE_MS);
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
}

function setupMutationObserver(): void {
  if (observer) observer.disconnect();

  const root = findObservationRoot();
  observer = new MutationObserver(() => {
    scheduleExtraction();
  });
  observer.observe(root, { childList: true, subtree: true });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    scheduleExtraction(500);
  }
});

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
      response = {
        success: inserted,
        data: { inserted },
        error: inserted ? undefined : "Comment box not found",
      };
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
  setTimeout(() => scheduleExtraction(0), INITIAL_EXTRACTION_DELAY_MS);
  void persistDebugLog("content", "content script ready");
}

init();
