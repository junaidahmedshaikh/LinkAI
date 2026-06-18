import { logger } from "@/utils/logger";

/**
 * Comment Button Detector
 * Detects when users click LinkedIn's native Comment button
 * Uses ARIA labels to find and monitor comment buttons
 */

export interface CommentClickEvent {
  commentButton: HTMLElement;
  postElement: HTMLElement;
  timestamp: number;
}

type CommentClickListener = (event: CommentClickEvent) => void;

class CommentDetector {
  private listeners: Set<CommentClickListener> = new Set();
  private isInitialized = false;

  /**
   * Start detecting comment button clicks
   */
  start(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Use event delegation on document to catch all comment clicks
    document.addEventListener("click", this.handleClick, true);
  }

  /**
   * Stop detecting comment button clicks
   */
  stop(): void {
    if (!this.isInitialized) return;
    this.isInitialized = false;

    document.removeEventListener("click", this.handleClick, true);
    this.listeners.clear();
  }

  /**
   * Subscribe to comment click events
   */
  onCommentClick(listener: CommentClickListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Handle click events with event delegation
   */
  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    // Check if clicked element is a comment button
    const commentButton = this.findCommentButton(target);
    if (!commentButton) return;

    logger.log("comment-detector", "Comment button clicked");

    // Find the nearest post element
    const postElement = this.findNearestPost(commentButton);
    if (!postElement) {
      logger.warn("comment-detector", "Could not find post for comment button");
      return;
    }

    logger.log("comment-detector", "Post found, notifying listeners");

    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener({
        commentButton,
        postElement,
        timestamp: Date.now(),
      });
    });
  };

  /**
   * Find comment button using ARIA label
   * Traverses up from clicked element to find button with aria-label containing "Comment"
   */
  private findCommentButton(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;

    // Search up to 5 levels
    for (let i = 0; i < 5; i++) {
      if (!current) break;

      // Check if element is a button with comment aria-label
      if (current.tagName === "BUTTON") {
        const ariaLabel = current.getAttribute("aria-label") || "";
        if (ariaLabel.toLowerCase().includes("comment")) {
          return current;
        }
      }

      current = current.parentElement;
    }

    return null;
  }

  /**
   * Find nearest post/feed item container
   * Uses SEMANTIC MARKERS ONLY: aria-labels, profile URLs, role attributes, DOM structure
   * NO CSS CLASSES (LinkedIn changes these constantly)
   */
  private findNearestPost(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;
    const MAX_LEVELS = 60;

    // ===== STRATEGY 1: Look for <article> tag (semantic HTML) =====
    current = element;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;
      if (current.tagName === "ARTICLE") {
        logger.log("comment-detector", "Post found: article tag", { level: i });
        return current;
      }
      current = current.parentElement;
    }

    // ===== STRATEGY 2: Look for semantic markers combination =====
    // A post container will have:
    // - One or more profile links (href="/in/...")
    // - Action buttons with semantic aria-labels (Comment, Like, Share, etc)
    // - Significant text content
    current = element;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;

      const hasProfileLink = this.containerHasProfileLink(current);
      const hasActionButtons = this.containerHasActionButtons(current);
      const hasSignificantText = this.containerHasSignificantText(current);

      if (hasProfileLink && hasActionButtons && hasSignificantText) {
        logger.log("comment-detector", "Post found: semantic combination", { level: i });
        return current;
      }

      current = current.parentElement;
    }

    // ===== STRATEGY 3: Look for role="article" or data attributes =====
    current = element;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;

      if (current.getAttribute("role") === "article") {
        logger.log("comment-detector", "Post found: role=article", { level: i });
        return current;
      }

      if (current.getAttribute("data-urn") || current.getAttribute("data-feed-item-id")) {
        logger.log("comment-detector", "Post found: data attribute", { level: i });
        return current;
      }

      current = current.parentElement;
    }

    logger.warn("comment-detector", "Post not found", { maxLevels: MAX_LEVELS, tag: element.tagName });
    this.logParentChain(element);
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
   * Action buttons: Comment, Like, Repost, Share, Send, React, etc
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
   * Posts should have meaningful paragraphs with text (not just metadata)
   */
  private containerHasSignificantText(container: HTMLElement): boolean {
    try {
      // Look for paragraphs or text elements
      const paragraphs = container.querySelectorAll(
        "p, div[role='paragraph'], span"
      );

      for (let para of paragraphs) {
        const text = para.textContent?.trim() || "";
        // Significant content: more than 20 characters, not just names/metadata
        if (text.length > 20 && !text.match(/^[A-Z][a-z]+\s[A-Z][a-z]+$/)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Log parent DOM chain for debugging (shows structure when detection fails)
   */
  private logParentChain(element: HTMLElement): void {
    const chain = [];
    let current: HTMLElement | null = element;
    for (let i = 0; i < 10 && current; i++) {
      const ariaLabel = current.getAttribute("aria-label");
      const role = current.getAttribute("role");
      const tag = current.tagName;
      const info = `${tag}${role ? `[role=${role}]` : ""}${ariaLabel ? `[aria=${ariaLabel}]` : ""}`;
      chain.push(info);
      current = current.parentElement;
    }
    logger.log("comment-detector", "Parent chain", { chain: chain.join(" > ") });
  }
}

export const commentDetector = new CommentDetector();
