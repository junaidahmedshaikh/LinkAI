/**
 * Comment Editor Detector
 * Uses MutationObserver to detect when LinkedIn comment editor opens
 * Looks for contenteditable textbox elements that appear in the DOM
 */

import { logger } from "@/utils/logger";

export interface EditorOpenedEvent {
  editor: HTMLElement;
  postElement: HTMLElement;
  timestamp: number;
}

type EditorOpenedListener = (event: EditorOpenedEvent) => void;

class CommentEditorDetector {
  private observers: Map<HTMLElement, MutationObserver> = new Map();
  private listeners: Set<EditorOpenedListener> = new Set();
  private trackedEditors: Set<HTMLElement> = new Set();
  private isInitialized = false;

  /**
   * Start watching for comment editors
   * Creates a MutationObserver on document body to detect new editors
   */
  start(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Scan for existing editors
    this.scanForEditors(document.body);

    // Watch for new editors (infinite scroll support)
    this.setupMutationObserver();
  }

  /**
   * Stop watching for comment editors
   */
  stop(): void {
    if (!this.isInitialized) return;
    this.isInitialized = false;

    // Disconnect all observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.trackedEditors.clear();
    this.listeners.clear();
  }

  /**
   * Subscribe to editor opened events
   */
  onEditorOpened(listener: EditorOpenedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Setup MutationObserver to watch for new editors
   */
  private setupMutationObserver(): void {
    const observer = new MutationObserver(() => {
      // Debounce with requestAnimationFrame
      requestAnimationFrame(() => {
        this.scanForEditors(document.body);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    this.observers.set(document.body, observer);
  }

  /**
   * Scan element and children for comment editors
   */
  private scanForEditors(element: HTMLElement): void {
    // Look for contenteditable textbox elements
    const editors = element.querySelectorAll(
      'div[contenteditable="true"][role="textbox"]'
    );

    if (editors.length > 0) {
      logger.log("comment-editor-detector", "Potential editors found", { count: editors.length });
    }

    editors.forEach((editor) => {
      const editorElement = editor as HTMLElement;

      // Skip if already tracked
      if (this.trackedEditors.has(editorElement)) return;

      // Verify it's actually a comment editor by checking aria-label
      const ariaLabel = editorElement.getAttribute("aria-label") || "";
      if (!ariaLabel.toLowerCase().includes("comment")) {
        return;
      }

      logger.log("comment-editor-detector", "Comment editor detected", { ariaLabel });

      // Mark as tracked
      this.trackedEditors.add(editorElement);

      // Find the post this editor belongs to
      const postElement = this.findPostForEditor(editorElement);
      if (!postElement) {
        logger.warn("comment-editor-detector", "Could not find post for editor");
        return;
      }

      // Notify listeners
      this.listeners.forEach((listener) => {
        listener({
          editor: editorElement,
          postElement,
          timestamp: Date.now(),
        });
      });
    });
  }

  /**
   * Find the post element that a given editor belongs to
   * Uses SEMANTIC MARKERS ONLY: aria-labels, profile URLs, role attributes, DOM structure
   * NO CSS CLASSES (LinkedIn changes these constantly)
   */
  private findPostForEditor(editor: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = editor;
    const MAX_LEVELS = 60;

    // ===== STRATEGY 1: Look for <article> tag =====
    current = editor;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;
      if (current.tagName === "ARTICLE") {
        return current;
      }
      current = current.parentElement;
    }

    // ===== STRATEGY 2: Look for semantic markers combination =====
    current = editor;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;

      const hasProfileLink = this.containerHasProfileLink(current);
      const hasActionButtons = this.containerHasActionButtons(current);
      const hasSignificantText = this.containerHasSignificantText(current);

      if (hasProfileLink && hasActionButtons && hasSignificantText) {
        return current;
      }

      current = current.parentElement;
    }

    // ===== STRATEGY 3: Look for role="article" or data attributes =====
    current = editor;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;

      if (current.getAttribute("role") === "article") {
        return current;
      }

      if (current.getAttribute("data-urn") || current.getAttribute("data-feed-item-id")) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  /**
   * Check if container has profile links
   * Profile links contain href="/in/" (LinkedIn profile URLs)
   */
  private containerHasProfileLink(container: HTMLElement): boolean {
    try {
      const profileLinks = container.querySelectorAll('a[href*="/in/"]');
      return profileLinks.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if container has action buttons with semantic aria-labels
   */
  private containerHasActionButtons(container: HTMLElement): boolean {
    try {
      const actionKeywords = [
        "comment",
        "like",
        "repost",
        "share",
        "send",
        "react",
      ];
      const buttons = container.querySelectorAll("button[aria-label]");

      for (let btn of buttons) {
        const label = (btn.getAttribute("aria-label") || "").toLowerCase();
        if (actionKeywords.some((keyword) => label.includes(keyword))) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if container has significant text content
   */
  private containerHasSignificantText(container: HTMLElement): boolean {
    try {
      const paragraphs = container.querySelectorAll(
        "p, div[role='paragraph'], span"
      );

      for (let para of paragraphs) {
        const text = para.textContent?.trim() || "";
        if (text.length > 20 && !text.match(/^[A-Z][a-z]+\s[A-Z][a-z]+$/)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}

export const commentEditorDetector = new CommentEditorDetector();
