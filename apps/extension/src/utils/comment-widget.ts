import { sendMessage, MessageType } from "@/services/messaging.service";
import { persistDebugLog } from "@/utils/debug";
import { sanitizeGeneratePayload } from "@/utils/comment-payload";
import { postExtractor } from "@/content/post-extractor";
import type { CommentTone, IGeneratedComment } from "@linkai/types";

const WIDGET_ID = "linkai-comment-widget";
const WIDGET_CLASS = "linkai-comment-widget-container";

interface WidgetState {
  isVisible: boolean;
  isGenerating: boolean;
  currentComment: string;
  currentTone: CommentTone;
  postElement: HTMLElement | null;
  isCopied: boolean;
}

class CommentWidget {
  private state: WidgetState = {
    isVisible: false,
    isGenerating: false,
    currentComment: "",
    currentTone: "professional",
    postElement: null,
    isCopied: false,
  };

  private widgetElement: HTMLElement | null = null;

  /**
   * Show the widget with tone selector near the post
   */
  show(postElement: HTMLElement): void {
    this.state.postElement = postElement;
    this.state.isVisible = true;

    if (!this.widgetElement) {
      this.widgetElement = this.createWidget();
      document.body.appendChild(this.widgetElement);
    } else {
      this.widgetElement.style.display = "flex";
    }

    this.positionWidget(postElement);
    this.resetWidget();
  }

  /**
   * Hide the widget
   */
  hide(): void {
    this.state.isVisible = false;
    if (this.widgetElement) {
      this.widgetElement.style.display = "none";
    }
  }

  /**
   * Create the widget DOM structure
   */
  private createWidget(): HTMLElement {
    const widget = document.createElement("div");
    widget.id = WIDGET_ID;
    widget.className = WIDGET_CLASS;

    widget.innerHTML = `
      <div class="linkai-widget-card">
        <!-- Header -->
        <div class="linkai-widget-header">
          <h3>Generate AI Comment</h3>
          <button class="linkai-widget-close" aria-label="Close widget">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Tone Selector -->
        <div class="linkai-widget-section">
          <label class="linkai-widget-label">Comment Tone:</label>
          <div class="linkai-tone-grid">
            <button class="linkai-tone-btn" data-tone="professional" title="Professional">💼 Professional</button>
            <button class="linkai-tone-btn" data-tone="thought-leadership" title="Thought Leadership">💡 Thought Leadership</button>
            <button class="linkai-tone-btn" data-tone="friendly" title="Friendly">😊 Friendly</button>
            <button class="linkai-tone-btn" data-tone="networking" title="Networking">🤝 Networking</button>
            <button class="linkai-tone-btn" data-tone="industry-expert" title="Industry Expert">🏆 Expert</button>
            <button class="linkai-tone-btn" data-tone="funny" title="Funny">😄 Funny</button>
          </div>
        </div>

        <!-- Generate Button (before generation) -->
        <button class="linkai-widget-generate-btn linkai-state-initial">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M12 3v18"></path>
          </svg>
          Generate Comment
        </button>

        <!-- Loading State -->
        <div class="linkai-widget-loading linkai-state-generating" style="display: none;">
          <div class="linkai-spinner"></div>
          <p>Generating your comment...</p>
        </div>

        <!-- Comment Display Area (after generation) -->
        <div class="linkai-widget-result linkai-state-generated" style="display: none;">
          <div class="linkai-comment-text"></div>
          
          <!-- Action Buttons -->
          <div class="linkai-widget-actions">
            <button class="linkai-action-btn linkai-copy-btn" title="Copy to clipboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
            <button class="linkai-action-btn linkai-insert-btn" title="Insert into comment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline>
                <line x1="12" y1="12" x2="20" y2="7.5"></line>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <line x1="12" y1="12" x2="4" y2="7.5"></line>
              </svg>
              Insert
            </button>
            <button class="linkai-action-btn linkai-regenerate-btn" title="Generate different comment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1 .12-8.83"></path>
              </svg>
              Regenerate
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div class="linkai-widget-error linkai-state-error" style="display: none;">
          <p class="linkai-error-message"></p>
          <button class="linkai-widget-generate-btn">Try Again</button>
        </div>
      </div>
    `;

    this.attachEventListeners(widget);
    this.injectStyles();

    return widget;
  }

  /**
   * Attach event listeners to widget elements
   */
  private attachEventListeners(widget: HTMLElement): void {
    // Close button
    widget.querySelector(".linkai-widget-close")?.addEventListener("click", () => {
      this.hide();
    });

    // Tone buttons
    widget.querySelectorAll(".linkai-tone-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const tone = target.dataset.tone as CommentTone;

        // Update UI
        widget.querySelectorAll(".linkai-tone-btn").forEach((b) => b.classList.remove("active"));
        target.classList.add("active");

        this.state.currentTone = tone;
      });
    });

    // Generate button
    widget.querySelector(".linkai-widget-generate-btn")?.addEventListener("click", () => {
      this.generateComment();
    });

    // Copy button
    widget.querySelector(".linkai-copy-btn")?.addEventListener("click", () => {
      this.copyToClipboard();
    });

    // Insert button
    widget.querySelector(".linkai-insert-btn")?.addEventListener("click", () => {
      this.insertComment();
    });

    // Regenerate button
    widget.querySelector(".linkai-regenerate-btn")?.addEventListener("click", () => {
      this.generateComment();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        this.state.isVisible &&
        !target.closest(`.${WIDGET_CLASS}`) &&
        !target.closest(`.linkai-comment-button`)
      ) {
        this.hide();
      }
    });
  }

  /**
   * Position widget relative to comment input
   */
  private positionWidget(postElement: HTMLElement): void {
    if (!this.widgetElement) return;

    // Find the comment input area within the post or below it
    const commentBox = postElement.querySelector('[data-testid="comment-input"]') ||
      postElement.querySelector('[placeholder*="comment"]') ||
      postElement.nextElementSibling?.querySelector('[placeholder*="comment"]');

    let targetPos = { top: 0, left: 0 };

    if (commentBox) {
      const rect = commentBox.getBoundingClientRect();
      targetPos.top = rect.bottom + 10; // 10px below the input
      targetPos.left = rect.right - 400; // 400px wide widget, align to right
    } else {
      // Fallback: position near the post
      const postRect = postElement.getBoundingClientRect();
      targetPos.top = postRect.bottom - 100;
      targetPos.left = postRect.right - 400;
    }

    // Ensure widget stays in viewport
    const maxLeft = window.innerWidth - 420; // 420 = 400px widget + 20px margin
    const adjustedLeft = Math.max(10, Math.min(targetPos.left, maxLeft));

    this.widgetElement.style.position = "fixed";
    this.widgetElement.style.top = `${targetPos.top}px`;
    this.widgetElement.style.left = `${adjustedLeft}px`;
    this.widgetElement.style.zIndex = "10000";
  }

  /**
   * Reset widget to initial state
   */
  private resetWidget(): void {
    if (!this.widgetElement) return;

    // Reset tone selection
    this.widgetElement.querySelectorAll(".linkai-tone-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tone") === "professional") {
        btn.classList.add("active");
      }
    });

    this.state.currentTone = "professional";
    this.state.currentComment = "";
    this.state.isCopied = false;

    this.showState("initial");
  }

  /**
   * Show/hide states
   */
  private showState(state: "initial" | "generating" | "generated" | "error"): void {
    if (!this.widgetElement) return;

    this.widgetElement.querySelectorAll("[class*='linkai-state-']").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    this.widgetElement
      .querySelector(`.linkai-state-${state}`)
      ?.setAttribute("style", "display: block !important;");
  }

  /**
   * Generate comment via message
   */
  private async generateComment(): Promise<void> {
    if (this.state.isGenerating || !this.state.postElement) return;

    this.state.isGenerating = true;
    this.showState("generating");

    try {
      const postData = postExtractor.extractPostData(this.state.postElement);
      const postContent = postData.postText.trim();

      if (!postContent || postContent.length < 10) {
        this.showError("Could not extract enough post content. Try a longer post.");
        this.showState("error");
        return;
      }

      // Send message to background script to generate
      const response = await sendMessage<{ comment: IGeneratedComment }>(
        {
          type: MessageType.LINKEDIN_GENERATE_COMMENT,
          payload: sanitizeGeneratePayload({
            postContent,
            tone: this.state.currentTone,
            postUrl: postData.postUrl,
            postAuthor: postData.authorName,
          }),
        }
      );

      // Check for messaging errors
      if (!response.success || response.error) {
        const errorMsg = response.error || "Failed to generate comment";

        // Check for extension context invalidation
        if (
          errorMsg.includes("Extension context") ||
          errorMsg.includes("extension may have been reloaded") ||
          errorMsg.includes("refresh the page")
        ) {
          this.showError(
            "Extension was reloaded. Please refresh the page to continue using AI comments."
          );
        } else {
          this.showError(errorMsg);
        }

        this.showState("error");
        return;
      }

      // Check for comment data
      if (response.data?.comment) {
        this.state.currentComment = response.data.comment.text;
        this.displayComment();
        this.showState("generated");
      } else {
        throw new Error("No comment generated");
      }
    } catch (error) {
      console.error("Failed to generate comment:", error);

      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      if (errorMsg.includes("Extension")) {
        this.showError("Extension error. Please refresh the page.");
      } else if (errorMsg.toLowerCase().includes("network") || errorMsg.includes("Cannot reach")) {
        this.showError(errorMsg);
      } else {
        this.showError(errorMsg);
      }

      this.showState("error");
    } finally {
      this.state.isGenerating = false;
    }
  }

  /**
   * Display the generated comment
   */
  private displayComment(): void {
    if (!this.widgetElement) return;

    const commentText = this.widgetElement.querySelector(".linkai-comment-text");
    if (commentText) {
      commentText.textContent = this.state.currentComment;
    }
  }

  /**
   * Copy comment to clipboard
   */
  private async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.state.currentComment);
      this.state.isCopied = true;

      const copyBtn = this.widgetElement?.querySelector(".linkai-copy-btn");
      if (copyBtn) {
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => {
          copyBtn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy';
          copyBtn.textContent = "Copy";
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  /**
   * Insert comment into LinkedIn comment box
   */
  private insertComment(): void {
    if (!this.state.currentComment || !this.state.postElement) return;

    try {
      // Find the comment input field
      const commentInput =
        this.state.postElement.querySelector('[data-testid="comment-input"]') ||
        this.state.postElement.querySelector('[placeholder*="comment"]') ||
        this.state.postElement.nextElementSibling?.querySelector('[placeholder*="comment"]');

      if (!commentInput) {
        throw new Error("Comment input not found");
      }

      // Click to focus if needed
      (commentInput as HTMLElement).click();

      // Set the value
      const inputElement = commentInput as HTMLInputElement | HTMLTextAreaElement;
      inputElement.value = this.state.currentComment;

      // Trigger input event for any listeners
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      // Show success feedback
      const insertBtn = this.widgetElement?.querySelector(".linkai-insert-btn");
      if (insertBtn) {
        const originalText = insertBtn.innerHTML;
        insertBtn.textContent = "✓ Inserted!";
        setTimeout(() => {
          insertBtn.innerHTML = originalText;
        }, 2000);
      }

      void persistDebugLog("widget", "Comment inserted successfully");
    } catch (error) {
      console.error("Failed to insert comment:", error);
      this.showError("Could not insert comment. Please try manual copy-paste.");
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (!this.widgetElement) return;

    const errorMsg = this.widgetElement.querySelector(".linkai-error-message");
    if (errorMsg) {
      errorMsg.textContent = message;
    }
  }

  /**
   * Inject widget styles
   */
  private injectStyles(): void {
    if (document.getElementById("linkai-widget-styles")) return;

    const style = document.createElement("style");
    style.id = "linkai-widget-styles";
    style.textContent = `
      #${WIDGET_ID} {
        position: fixed;
        display: flex;
        align-items: flex-start;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
      }

      .linkai-widget-card {
        width: 400px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .linkai-widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e5e5e5;
        padding-bottom: 12px;
        margin-bottom: 8px;
      }

      .linkai-widget-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #0a66c2;
      }

      .linkai-widget-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #666;
        transition: color 0.2s;
      }

      .linkai-widget-close:hover {
        color: #000;
      }

      .linkai-widget-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .linkai-widget-label {
        font-size: 13px;
        font-weight: 600;
        color: #333;
      }

      .linkai-tone-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .linkai-tone-btn {
        padding: 8px 12px;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        color: #333;
        text-align: center;
      }

      .linkai-tone-btn:hover {
        background: #e5e5e5;
        border-color: #999;
      }

      .linkai-tone-btn.active {
        background: linear-gradient(135deg, #0a66c2 0%, #0855a8 100%);
        color: white;
        border-color: #0a66c2;
      }

      .linkai-widget-generate-btn {
        padding: 10px 16px;
        background: linear-gradient(135deg, #0a66c2 0%, #0855a8 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .linkai-widget-generate-btn:hover {
        background: linear-gradient(135deg, #0855a8 0%, #064494 100%);
        transform: translateY(-1px);
      }

      .linkai-widget-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 16px;
      }

      .linkai-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #f0f0f0;
        border-top-color: #0a66c2;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .linkai-widget-loading p {
        margin: 0;
        color: #666;
        font-size: 13px;
      }

      .linkai-widget-result {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .linkai-comment-text {
        background: #f5f5f5;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 12px;
        font-size: 13px;
        line-height: 1.5;
        color: #333;
        max-height: 200px;
        overflow-y: auto;
      }

      .linkai-widget-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .linkai-action-btn {
        flex: 1;
        min-width: 100px;
        padding: 8px 12px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #333;
      }

      .linkai-action-btn:hover {
        background: #f5f5f5;
        border-color: #0a66c2;
        color: #0a66c2;
      }

      .linkai-widget-error {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
      }

      .linkai-error-message {
        margin: 0;
        font-size: 13px;
        color: #856404;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .linkai-widget-card {
          width: 320px;
        }

        .linkai-tone-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;

    document.head.appendChild(style);
  }
}

export const commentWidget = new CommentWidget();
