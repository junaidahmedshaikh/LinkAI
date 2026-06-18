/**
 * LinkedIn Comment Handler - Main orchestrator for AI comment generation
 *
 * FILE PURPOSE:
 * Coordinates the entire AI comment generation flow on LinkedIn:
 * 1. Detects when user clicks LinkedIn's native comment button
 * 2. Waits for comment editor to appear
 * 3. Injects "AI Comment" button into editor toolbar
 * 4. Handles button clicks to generate and insert comments
 * 5. Manages UI state and error notifications
 *
 * ARCHITECTURE:
 * - Acts as facade/orchestrator combining multiple detector modules
 * - Depends on: commentDetector, commentEditorDetector, commentButtonInjector, postExtractor, commentGenerator
 * - Used by: content/index.ts when page is LinkedIn feed or post
 * - Lifecycle: start() on feed pages, stop() when leaving feed
 *
 * DATA FLOW:
 * User clicks comment → commentDetector fires → commentEditorDetector detects editor → 
 * handleEditorOpened → injectButton → User clicks AI button → handleGenerateClick → 
 * extractPostData → generateComment → insertCommentIntoEditor
 *
 * ERROR HANDLING:
 * - Auth errors: Show login button with friendly message
 * - Generation errors: Show error notification with auto-dismiss
 * - Extraction errors: Graceful degradation with user message
 *
 * STATE MANAGEMENT:
 * - activeEditors Map: Tracks in-flight comment generations
 * - isInitialized: Prevents duplicate initialization
 * - unsubscribers: Cleanup function storage for event handlers
 */

import { commentDetector, type CommentClickEvent } from "./comment-detector";
import {
  commentEditorDetector,
  type EditorOpenedEvent,
} from "./comment-editor-detector";
import { commentButtonInjector } from "./comment-button-injector";
import { postExtractor } from "./post-extractor";
import { commentGenerator, type GenerationRequest } from "./comment-generator";
import { insertIntoLinkedInEditor } from "@/content/utils/prosemirror-insert";
import { persistDebugLog } from "@/utils/debug";
import { logger } from "@/utils/logger";

// ============ CONSTANTS ============
const TOOLBAR_RENDER_DELAY_MS = 100;

// Notification timing
const AUTH_ERROR_NOTIFICATION_DURATION_MS = 10000; // Longer for auth errors
const GENERAL_ERROR_NOTIFICATION_DURATION_MS = 6000;
const NOTIFICATION_FADE_OUT_DURATION_MS = 300;

// UI constraints
const ERROR_NOTIFICATION_Z_INDEX = "10000";
const ERROR_NOTIFICATION_MAX_WIDTH = "420px";

// Validation constants
const MIN_POST_CONTENT_LENGTH = 10;

// Editor state interface
interface EditorState {
  isLoading: boolean;
  postElement: HTMLElement;
}

// ============ IMPLEMENTATION ============
class LinkedInCommentHandler {
  private isInitialized = false;
  private activeEditors: Map<HTMLElement, EditorState> = new Map();
  private unsubscribers: Array<() => void> = [];

  /**
   * Initialize the comment handler
   *
   * WHAT: Starts all detector modules and subscribes to their events
   * WHY: Called when page is identified as feed/post page
   * FLOW:
   * 1. Check if already initialized (prevent duplicates)
   * 2. Start all detector modules
   * 3. Subscribe to detector events
   * 4. Log initialization
   *
   * CALLED BY: content/index.ts on feed pages
   * USED BY: Tests, page monitoring
   */
  start(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    void persistDebugLog("linkedin-handler", "Starting LinkedIn comment handler");

    // Start all detector modules
    commentDetector.start();
    commentEditorDetector.start();

    // Subscribe to their events
    this.subscribeToEvents();
  }

  /**
   * Stop the comment handler
   *
   * WHAT: Shuts down all listeners and cleanup
   * WHY: Called when leaving feed page or unloading extension
   * FLOW:
   * 1. Check if initialized (prevent double-stop)
   * 2. Unsubscribe from all events
   * 3. Stop detector modules
   * 4. Cleanup injected buttons
   * 5. Clear state
   *
   * IMPORTANT: Clean stop prevents memory leaks and event handler doubles
   */
  stop(): void {
    if (!this.isInitialized) return;
    this.isInitialized = false;

    // Unsubscribe from all events (prevents memory leaks)
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Stop detector modules
    commentDetector.stop();
    commentEditorDetector.stop();

    // Clean up injected buttons from DOM
    commentButtonInjector.cleanup();

    void persistDebugLog("linkedin-handler", "Stopped LinkedIn comment handler");
  }

  /**
   * Subscribe to detector events
   *
   * WHAT: Sets up event handlers for comment and editor detectors
   * WHY: Orchestrates the flow: comment click → editor detected → button injected
   *
   * HANDLERS:
   * 1. commentDetector.onCommentClick() - Logs comment button clicks
   * 2. commentEditorDetector.onEditorOpened() - Triggers button injection
   */
  private subscribeToEvents(): void {
    // Handler 1: Comment button clicked (mostly for logging/debugging)
    const unsubComment = commentDetector.onCommentClick((event: CommentClickEvent) => {
      void persistDebugLog("linkedin-handler", "Comment button clicked", {
        timestamp: event.timestamp,
      });
    });
    this.unsubscribers.push(unsubComment);

    // Handler 2: Comment editor appeared (main flow trigger)
    const unsubEditor = commentEditorDetector.onEditorOpened((event: EditorOpenedEvent) => {
      this.handleEditorOpened(event);
    });
    this.unsubscribers.push(unsubEditor);
  }

  /**
   * Handle comment editor opening
   *
   * WHAT: Injects AI button when editor appears
   * WHY: This is the entry point to our comment generation UI
   *
   * FLOW:
   * 1. Store editor reference in activeEditors
   * 2. Wait for toolbar to render (LinkedIn async behavior)
   * 3. Inject AI button into toolbar
   * 4. Subscribe to button clicks
   * 5. Setup cleanup when editor is removed
   *
   * TIMING: Uses setTimeout to wait for LinkedIn's async rendering
   */
  private handleEditorOpened(event: EditorOpenedEvent): void {
    const { editor, postElement } = event;

    void persistDebugLog("linkedin-handler", "Comment editor opened", {
      timestamp: event.timestamp,
      editorAriaLabel: editor.getAttribute("aria-label"),
      editorParent: editor.parentElement?.tagName,
    });

    // Store editor state for this generation session
    this.activeEditors.set(editor, {
      isLoading: false,
      postElement,
    });

    // Wait for toolbar to render before injecting button
    // LinkedIn renders UI components asynchronously
    setTimeout(() => {
      this.injectButtonAndSetupHandlers(editor, postElement);
    }, TOOLBAR_RENDER_DELAY_MS);
  }

  /**
   * Inject button and setup click handlers
   *
   * WHAT: Private helper for button injection and handler setup
   * WHY: Extracted from handleEditorOpened for clarity
   *
   * @private
   */
  private injectButtonAndSetupHandlers(editor: HTMLElement, postElement: HTMLElement): void {
    // Try to inject button
    const button = commentButtonInjector.injectButton(editor);
    if (!button) {
      void persistDebugLog("linkedin-handler", "Failed to inject button", {
        editorClass: editor.className,
        parentTag: editor.parentElement?.tagName,
      });
      return;
    }

    void persistDebugLog("linkedin-handler", "Button injected successfully");

    // Setup button click handler
    const unsubClick = commentButtonInjector.onButtonClick((_button, clickedEditor) => {
      if (clickedEditor === editor) {
        void this.handleGenerateClick(editor, postElement, _button);
      }
    });
    this.unsubscribers.push(unsubClick);

    // Setup cleanup when editor is removed from DOM
    this.setupEditorCleanup(editor);
  }

  /**
   * Handle AI button click
   *
   * WHAT: Main generation flow - extract, generate, insert
   * WHY: User clicked the AI button
   *
   * FLOW:
   * 1. Check if already generating (prevent duplicate)
   * 2. Show loading state on button
   * 3. Extract post content
   * 4. Call AI generation
   * 5. Insert into editor on success
   * 6. Show error on failure
   * 7. Restore button state
   *
   * ERROR HANDLING:
   * - Post extraction failure: Show error
   * - Generation failure: Show error with potential login button
   * - Insertion failure: Show error
   *
   * USED BY: Button click handler
   */
  private async handleGenerateClick(
    editor: HTMLElement,
    postElement: HTMLElement,
    button?: HTMLElement
  ): Promise<void> {
    const editorState = this.activeEditors.get(editor);
    if (!editorState || editorState.isLoading) return;

    // Prevent duplicate requests
    editorState.isLoading = true;

    // Provide UI feedback
    if (button) {
      this.setButtonLoading(button, true);
    }

    try {
      logger.log("linkedin-handler", "Starting comment generation");
      void persistDebugLog("linkedin-handler", "Starting comment generation");

      // Step 1: Extract post content
      const postData = postExtractor.extractPostData(postElement);
      logger.log("linkedin-handler", "Post extracted", {
        contentLength: postData.postText.length,
        author: postData.authorName,
        mediaType: postData.mediaType,
      });

      // Validate minimum content length
      if (!postData.postText || postData.postText.length < MIN_POST_CONTENT_LENGTH) {
        logger.warn("linkedin-handler", "Post content too short", {
          length: postData.postText.length,
        });
        throw new Error("Could not extract meaningful post content. Try a longer post.");
      }

      // Step 2: Request AI generation
      const request: GenerationRequest = {
        postContent: postData.postText,
        tone: "professional", // TODO: Make tone configurable via UI
        postUrl: postData.postUrl,
        authorName: postData.authorName,
      };

      logger.log("linkedin-handler", "Sending to AI backend", {
        contentLength: postData.postText.length,
      });
      const result = await commentGenerator.generateComment(request);

      // Handle generation result
      if (!result.success || !result.comment) {
        const errorMsg = result.error || "Failed to generate comment";
        logger.warn("linkedin-handler", "Generation failed", { error: errorMsg });
        void persistDebugLog("linkedin-handler", "Generation failed", {
          error: errorMsg,
        });
        this.showError(errorMsg);
        return;
      }

      // Step 3: Insert into editor
      logger.log("linkedin-handler", "Comment generated");
      this.insertCommentIntoEditor(editor, result.comment.text);
      void persistDebugLog("linkedin-handler", "Comment generated and inserted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("linkedin-handler", message);
      void persistDebugLog("linkedin-handler", "Error during generation", { error: message });
      this.showError(message);
    } finally {
      // Always restore state
      editorState.isLoading = false;
      if (button) {
        this.setButtonLoading(button, false);
      }
    }
  }

  /**
   * Set button UI loading state
   *
   * WHAT: Disables/enables button and shows loading indicator
   * WHY: Provides visual feedback that generation is in progress
   *
   * STATES:
   * - Loading: Opacity 0.6, pointer-events disabled
   * - Ready: Opacity 1, pointer-events enabled
   *
   * @private
   * @param button - Button element to update
   * @param isLoading - Whether to show loading state
   */
  private setButtonLoading(button: HTMLElement, isLoading: boolean): void {
    if (isLoading) {
      button.style.opacity = "0.6";
      button.style.pointerEvents = "none";
      button.title = "Generating comment...";
      logger.log("linkedin-handler", "Button disabled (loading)");
    } else {
      button.style.opacity = "1";
      button.style.pointerEvents = "auto";
      button.title = "Generate AI comment with LinkAI";
      logger.log("linkedin-handler", "Button enabled (ready)");
    }
  }

  /**
   * Insert comment text into LinkedIn's ProseMirror editor
   *
   * WHAT: Places generated text into the comment editor
   * WHY: User sees generated comment ready to post
   *
   * HOW:
   * 1. Find or create <p> tag in contenteditable div
   * 2. Set text content
   * 3. Remove empty state CSS classes
   * 4. Position cursor at end
   * 5. Dispatch multiple events for LinkedIn to recognize change
   *
   * TECHNICAL NOTES:
   * - LinkedIn uses ProseMirror/Tiptap for rich text editing
   * - Editor structure: <div contenteditable> → <p> tag
   * - Must dispatch input, change, keyup events
   * - Cursor positioning uses Selection API
   *
   * @private
   * @param editor - The contenteditable editor element
   * @param text - Generated comment text to insert
   */
  private insertCommentIntoEditor(editor: HTMLElement, text: string): void {
    const inserted = insertIntoLinkedInEditor(editor, text);
    if (inserted) {
      void persistDebugLog("linkedin-handler", "Comment inserted into editor", {
        charCount: text.length,
        elementType: "ProseMirror",
      });
    } else {
      void persistDebugLog("linkedin-handler", "Failed to insert comment");
    }
  }

  /**
   * Show error notification to user
   *
   * WHAT: Displays error message as fixed notification
   * WHY: User needs to know what went wrong
   *
   * FEATURES:
   * - Auth errors: Show login button
   * - Auto-dismiss after timeout
   * - Animated slideIn and fadeOut
   * - Styled to match LinkedIn design
   *
   * ERROR TYPES:
   * 1. Auth errors (contains "login", "authentication")
   *    → Shows clickable "Click to Login" button
   *    → Longer timeout (10s)
   * 2. Other errors
   *    → Simple message with auto-dismiss
   *    → Shorter timeout (6s)
   *
   * @private
   * @param message - Error message to display
   */
  private showError(message: string): void {
    logger.error("linkedin-handler", message);

    // Detect error type
    const isAuthError =
      message.toLowerCase().includes("log in") ||
      message.toLowerCase().includes("authentication") ||
      message.toLowerCase().includes("authenticate");

    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #d32f2f;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: ${ERROR_NOTIFICATION_Z_INDEX};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: ${ERROR_NOTIFICATION_MAX_WIDTH};
      animation: slideIn 0.3s ease-out;
      line-height: 1.5;
    `;

    if (isAuthError) {
      // Auth error: show with login button
      notification.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div>❌ ${message}</div>
          <button id="linkai-login-btn" style="
            background-color: #fff;
            color: #d32f2f;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
          ">Click to Login</button>
        </div>
      `;

      // Add button handlers
      setTimeout(() => {
        const btn = document.getElementById("linkai-login-btn");
        if (btn) {
          btn.addEventListener("click", () => {
            logger.log("linkedin-handler", "Opening login options");
            chrome.runtime.openOptionsPage?.();
            notification.remove();
          });
          btn.addEventListener("mouseenter", () => {
            btn.style.backgroundColor = "#f0f0f0";
          });
          btn.addEventListener("mouseleave", () => {
            btn.style.backgroundColor = "#fff";
          });
        }
      }, 0);
    } else {
      // Generic error: simple message
      notification.textContent = `❌ LinkAI: ${message}`;
    }

    document.body.appendChild(notification);

    // Auto-dismiss with fade animation
    const timeout = isAuthError
      ? AUTH_ERROR_NOTIFICATION_DURATION_MS
      : GENERAL_ERROR_NOTIFICATION_DURATION_MS;

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transition = `opacity ${NOTIFICATION_FADE_OUT_DURATION_MS}ms ease-out`;
      setTimeout(() => notification.remove(), NOTIFICATION_FADE_OUT_DURATION_MS);
    }, timeout);

    void persistDebugLog("linkedin-handler", "User error shown", { message, isAuthError });
  }

  /**
   * Setup cleanup when editor is removed from DOM
   *
   * WHAT: Watches for editor removal and cleans up resources
   * WHY: Prevents memory leaks and orphaned event handlers
   *
   * LOGIC:
   * 1. Setup MutationObserver on document body
   * 2. Check if editor still in DOM each mutation
   * 3. If removed: cleanup button, remove from activeEditors, disconnect observer
   *
   * MEMORY SAFETY:
   * - Each editor gets exactly one observer
   * - Observer disconnects when editor removed
   * - Prevents duplicate cleanup attempts
   *
   * @private
   * @param editor - Editor element to watch
   */
  private setupEditorCleanup(editor: HTMLElement): void {
    const observer = new MutationObserver(() => {
      // Check if editor still exists in DOM
      if (!document.contains(editor)) {
        // Editor removed, cleanup resources
        commentButtonInjector.removeButton(editor);
        this.activeEditors.delete(editor);
        observer.disconnect();

        void persistDebugLog("linkedin-handler", "Cleaned up editor");
      }
    });

    // Watch for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

export const linkedInCommentHandler = new LinkedInCommentHandler();
