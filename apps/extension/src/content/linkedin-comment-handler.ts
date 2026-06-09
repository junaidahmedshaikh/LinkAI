/**
 * LinkedIn Comment Handler
 * Main orchestrator for AI comment generation on LinkedIn
 * Coordinates all modules: detection, injection, extraction, generation
 */

import { commentDetector, type CommentClickEvent } from "./comment-detector";
import {
  commentEditorDetector,
  type EditorOpenedEvent,
} from "./comment-editor-detector";
import { commentButtonInjector } from "./comment-button-injector";
import { postExtractor } from "./post-extractor";
import { commentGenerator, type GenerationRequest } from "./comment-generator";
import { persistDebugLog } from "@/utils/debug";

class LinkedInCommentHandler {
  private isInitialized = false;
  private activeEditors: Map<HTMLElement, { isLoading: boolean; postElement: HTMLElement }> =
    new Map();
  private unsubscribers: Array<() => void> = [];

  /**
   * Initialize the comment handler
   */
  start(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    void persistDebugLog("linkedin-handler", "Starting LinkedIn comment handler");

    // Start detectors
    commentDetector.start();
    commentEditorDetector.start();

    // Subscribe to events
    this.subscribeToEvents();
  }

  /**
   * Stop the comment handler
   */
  stop(): void {
    if (!this.isInitialized) return;
    this.isInitialized = false;

    // Unsubscribe from all events
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Stop detectors
    commentDetector.stop();
    commentEditorDetector.stop();

    // Clean up injected buttons
    commentButtonInjector.cleanup();

    void persistDebugLog("linkedin-handler", "Stopped LinkedIn comment handler");
  }

  /**
   * Subscribe to detector events
   */
  private subscribeToEvents(): void {
    // When comment button is clicked, we wait for editor to open
    // (which the EditorDetector will catch)
    const unsubComment = commentDetector.onCommentClick((event: CommentClickEvent) => {
      void persistDebugLog("linkedin-handler", "Comment button clicked", {
        timestamp: event.timestamp,
      });
    });
    this.unsubscribers.push(unsubComment);

    // When comment editor opens, inject AI button
    const unsubEditor = commentEditorDetector.onEditorOpened((event: EditorOpenedEvent) => {
      this.handleEditorOpened(event);
    });
    this.unsubscribers.push(unsubEditor);
  }

  /**
   * Handle comment editor opening
   */
  private handleEditorOpened(event: EditorOpenedEvent): void {
    const { editor, postElement } = event;

    void persistDebugLog("linkedin-handler", "Comment editor opened", {
      timestamp: event.timestamp,
      editorAriaLabel: editor.getAttribute("aria-label"),
      editorParent: editor.parentElement?.tagName,
    });

    // Track this editor
    this.activeEditors.set(editor, {
      isLoading: false,
      postElement,
    });

    // Wait a bit for toolbar to render (LinkedIn renders async)
    setTimeout(() => {
      // Inject AI button
      const button = commentButtonInjector.injectButton(editor);
      if (!button) {
        void persistDebugLog("linkedin-handler", "Failed to inject button", {
          editorClass: editor.className,
          parentTag: editor.parentElement?.tagName,
        });
        return;
      }

      void persistDebugLog("linkedin-handler", "Button injected successfully");

      // Handle button clicks
      const unsubClick = commentButtonInjector.onButtonClick((_button, clickedEditor) => {
        if (clickedEditor === editor) {
          void this.handleGenerateClick(editor, postElement, _button);
        }
      });

      this.unsubscribers.push(unsubClick);

      // Clean up when editor is removed from DOM
      this.setupEditorCleanup(editor);
    }, 100);
  }

  /**
   * Handle AI button click
   */
  private async handleGenerateClick(
    editor: HTMLElement,
    postElement: HTMLElement,
    button?: HTMLElement
  ): Promise<void> {
    const editorState = this.activeEditors.get(editor);
    if (!editorState || editorState.isLoading) return;

    // Mark as loading
    editorState.isLoading = true;

    // Show loading state on button
    if (button) {
      this.setButtonLoading(button, true);
    }

    try {
      console.log(`[LinkAI] Starting comment generation...`);
      void persistDebugLog("linkedin-handler", "Starting comment generation");

      // Extract post data
      const postData = postExtractor.extractPostData(postElement);
      console.log(`[LinkAI] Post extracted:`, {
        contentLength: postData.postText.length,
        contentPreview: postData.postText.substring(0, 100),
        author: postData.authorName,
        mediaType: postData.mediaType,
      });

      // Validate post content
      if (!postData.postText || postData.postText.length < 10) {
        console.log(`[LinkAI] ❌ Post content too short: ${postData.postText.length} chars`);
        throw new Error("Could not extract meaningful post content. Try a longer post.");
      }

      // Generate comment
      const request: GenerationRequest = {
        postContent: postData.postText,
        tone: "professional", // Default tone, could be made configurable
        postUrl: postData.postUrl,
        authorName: postData.authorName,
      };

      console.log(`[LinkAI] Sending to AI backend with ${postData.postText.length} chars of content...`);
      const result = await commentGenerator.generateComment(request);

      if (!result.success || !result.comment) {
        const errorMsg = result.error || "Failed to generate comment";
        console.log(`[LinkAI] ❌ Generation failed: ${errorMsg}`);
        void persistDebugLog("linkedin-handler", "Generation failed", {
          error: errorMsg,
        });
        this.showError(errorMsg);
        return;
      }

      console.log(`[LinkAI] ✓ Comment generated: "${result.comment.text.substring(0, 50)}..."`);

      // Insert comment into editor
      this.insertCommentIntoEditor(editor, result.comment.text);

      console.log(`[LinkAI] ✓ Comment inserted into editor`);
      void persistDebugLog("linkedin-handler", "Comment generated and inserted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`[LinkAI] ❌ Error: ${message}`);
      void persistDebugLog("linkedin-handler", "Error during generation", { error: message });
      this.showError("Error generating comment");
    } finally {
      editorState.isLoading = false;

      // Hide loading state on button
      if (button) {
        this.setButtonLoading(button, false);
      }
    }
  }

  /**
   * Set button loading state
   */
  private setButtonLoading(button: HTMLElement, isLoading: boolean): void {
    if (isLoading) {
      button.style.opacity = "0.6";
      button.style.pointerEvents = "none";
      button.title = "Generating comment...";
      console.log(`[LinkAI] Button disabled (loading)`);
    } else {
      button.style.opacity = "1";
      button.style.pointerEvents = "auto";
      button.title = "Generate AI comment with LinkAI";
      console.log(`[LinkAI] Button enabled (ready)`);
    }
  }

  /**
   * Insert comment text into editor
   * Handles ProseMirror/Tiptap editor structure used by LinkedIn
   */
  private insertCommentIntoEditor(editor: HTMLElement, text: string): void {
    try {
      console.log(`[LinkAI] Inserting comment into editor...`);

      // Find the <p> tag inside the contenteditable div (ProseMirror structure)
      let paragraph = editor.querySelector("p");
      
      if (!paragraph) {
        console.log(`[LinkAI] ⚠️ No <p> tag found, creating one...`);
        paragraph = document.createElement("p");
        editor.innerHTML = "";
        editor.appendChild(paragraph);
      }

      // Clear the paragraph content (remove <br> and placeholder)
      paragraph.innerHTML = "";
      paragraph.textContent = text;

      // Remove empty state classes
      paragraph.classList.remove("is-empty");
      paragraph.classList.remove("is-editor-empty");

      // Remove placeholder attribute if present
      paragraph.removeAttribute("data-placeholder");

      console.log(`[LinkAI] ✓ Text inserted into <p> tag`);

      // Focus the editor
      editor.focus();

      // Move cursor to end of text
      const range = document.createRange();
      const sel = window.getSelection();
      if (sel && paragraph.firstChild) {
        range.setStart(paragraph.firstChild, text.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        console.log(`[LinkAI] ✓ Cursor positioned at end`);
      }

      // Trigger all necessary events to notify LinkedIn
      console.log(`[LinkAI] Dispatching change events...`);

      // 1. Input event (most important for contenteditable)
      editor.dispatchEvent(
        new Event("input", {
          bubbles: true,
          cancelable: true,
        })
      );

      // 2. Change event
      editor.dispatchEvent(
        new Event("change", {
          bubbles: true,
          cancelable: true,
        })
      );

      // 3. Keyup event
      editor.dispatchEvent(
        new KeyboardEvent("keyup", {
          bubbles: true,
          cancelable: true,
          key: "End",
          code: "End",
          keyCode: 35,
        })
      );

      // 4. Blur and refocus to trigger validation
      editor.blur();
      setTimeout(() => editor.focus(), 50);

      console.log(`[LinkAI] ✓ Comment inserted and events dispatched`);
      void persistDebugLog("linkedin-handler", "Comment inserted into editor", {
        charCount: text.length,
        elementType: "ProseMirror",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`[LinkAI] ❌ Failed to insert comment: ${message}`);
      void persistDebugLog("linkedin-handler", "Failed to insert comment", { error: message });
    }
  }

  /**
   * Show error message to user
   */
  private showError(message: string): void {
    console.error(`[LinkAI] Error: ${message}`);

    // Check if this is an auth error
    const isAuthError =
      message.toLowerCase().includes("log in") ||
      message.toLowerCase().includes("authentication") ||
      message.toLowerCase().includes("authenticate");

    // Create error notification
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
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 420px;
      animation: slideIn 0.3s ease-out;
      line-height: 1.5;
    `;

    if (isAuthError) {
      // Add clickable link for auth errors
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

      // Add button click handler
      setTimeout(() => {
        const btn = document.getElementById("linkai-login-btn");
        if (btn) {
          btn.addEventListener("click", () => {
            console.log(`[LinkAI] Opening login popup...`);
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
      notification.textContent = `❌ LinkAI: ${message}`;
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 8 seconds (longer for auth errors)
    const removeTimeout = isAuthError ? 10000 : 6000;
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, removeTimeout);

    // Also log to debug
    void persistDebugLog("linkedin-handler", "User error shown", { message, isAuthError });
  }

  /**
   * Setup cleanup when editor is removed from DOM
   */
  private setupEditorCleanup(editor: HTMLElement): void {
    // Use MutationObserver to detect when editor is removed
    const observer = new MutationObserver(() => {
      // Check if editor is still in DOM
      if (!document.contains(editor)) {
        // Editor removed, clean up
        commentButtonInjector.removeButton(editor);
        this.activeEditors.delete(editor);
        observer.disconnect();

        void persistDebugLog("linkedin-handler", "Cleaned up editor");
      }
    });

    // Watch for removals
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

export const linkedInCommentHandler = new LinkedInCommentHandler();
