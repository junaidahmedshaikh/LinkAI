/**
 * Comment Button Injector
 * Injects AI Comment button into LinkedIn's comment toolbar
 * Uses ARIA labels to find toolbar and insertion points
 * Prevents duplicate injections
 */

const AI_BUTTON_DATA_ATTR = "data-ai-comment-button";

export interface InjectedButton {
  button: HTMLElement;
  editor: HTMLElement;
  injectedAt: number;
}

type ButtonClickListener = (button: HTMLElement, editor: HTMLElement) => void;

class CommentButtonInjector {
  private injectedButtons: Map<HTMLElement, InjectedButton> = new Map();
  private clickListeners: Set<ButtonClickListener> = new Set();

  /**
   * Inject AI Comment button into toolbar
   */
  injectButton(editor: HTMLElement): HTMLElement | null {
    // Check if button already injected for this editor
    if (this.injectedButtons.has(editor)) {
      console.log(`[LinkAI] Button already injected for this editor`);
      return this.injectedButtons.get(editor)?.button ?? null;
    }

    console.log(`[LinkAI] Attempting to inject button...`);

    // Find the toolbar
    const toolbar = this.findToolbar(editor);
    if (!toolbar) {
      console.log(`[LinkAI] ❌ Toolbar not found`);
      return null;
    }
    console.log(`[LinkAI] ✓ Toolbar found`);

    // Find insertion point (emoji button)
    const insertionPoint = this.findInsertionPoint(toolbar);
    if (!insertionPoint) {
      console.log(`[LinkAI] ❌ Insertion point (emoji button) not found`);
      console.log(`[LinkAI] Toolbar contains ${toolbar.querySelectorAll('button').length} buttons`);
      toolbar.querySelectorAll('button').forEach((btn, i) => {
        console.log(`  Button ${i}: aria-label="${btn.getAttribute('aria-label')}"`);
      });
      return null;
    }
    console.log(`[LinkAI] ✓ Insertion point found (${insertionPoint.getAttribute('aria-label')})`);

    // Create the AI button
    const aiButton = this.createAIButton();
    console.log(`[LinkAI] ✓ AI button created`);

    // Inject button after insertion point
    insertionPoint.parentElement?.insertBefore(aiButton, insertionPoint.nextElementSibling);
    console.log(`[LinkAI] ✓ AI button injected into DOM`);

    // Store reference
    const injected: InjectedButton = {
      button: aiButton,
      editor,
      injectedAt: Date.now(),
    };

    this.injectedButtons.set(editor, injected);

    // Setup click handler
    aiButton.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[LinkAI] AI button clicked`);
      
      // Call all registered listeners
      this.clickListeners.forEach((listener) => listener(aiButton, editor));
    });

    console.log(`[LinkAI] ✓ Button fully set up and ready`);
    return aiButton;
  }

  /**
   * Remove injected button
   */
  removeButton(editor: HTMLElement): void {
    const injected = this.injectedButtons.get(editor);
    if (injected) {
      injected.button.remove();
      this.injectedButtons.delete(editor);
    }
  }

  /**
   * Subscribe to button clicks
   */
  onButtonClick(listener: ButtonClickListener): () => void {
    this.clickListeners.add(listener);
    return () => this.clickListeners.delete(listener);
  }

  /**
   * Find the toolbar container in the comment editor
   * Looks for buttons with aria-labels like emoji, photo, etc.
   */
  private findToolbar(editor: HTMLElement): HTMLElement | null {
    // First, try to find toolbar as a sibling or near the editor
    let current: HTMLElement | null = editor;

    for (let i = 0; i < 15; i++) {
      if (!current) break;

      // Check parent element for toolbar
      if (current.getAttribute("role") === "toolbar") return current;

      // Look for toolbar as child
      const toolbarChild = current.querySelector('[role="toolbar"]') as HTMLElement | null;
      if (toolbarChild) return toolbarChild;

      // Look for button containers
      const buttonContainer = current.querySelector(
        'div[role="toolbar"], div[class*="toolbar"], div[class*="button"]'
      ) as HTMLElement | null;
      if (buttonContainer && this.hasCommentButtons(buttonContainer)) {
        return buttonContainer;
      }

      // Check next sibling
      if (current.nextElementSibling) {
        const sibling = current.nextElementSibling as HTMLElement;
        if (sibling.getAttribute("role") === "toolbar") return sibling;
        if (this.hasCommentButtons(sibling)) return sibling;
      }

      current = current.parentElement;
    }

    return null;
  }

  /**
   * Check if element contains comment toolbar buttons
   */
  private hasCommentButtons(element: HTMLElement): boolean {
    // Look for emoji or photo buttons which are in the comment toolbar
    const emojiButton = element.querySelector('button[aria-label*="Emoji"], button[aria-label*="emoji"]');
    const photoButton = element.querySelector('button[aria-label*="photo"], button[aria-label*="Photo"]');
    const hasAnyButton = element.querySelector("button");

    return !!(emojiButton || photoButton) || (!!(hasAnyButton && element.querySelectorAll("button").length > 2));
  }

  /**
   * Find insertion point using ARIA labels
   * Looks for emoji button as anchor
   */
  private findInsertionPoint(toolbar: HTMLElement): HTMLElement | null {
    // Look for emoji button using aria-label
    const emojiButton = toolbar.querySelector(
      'button[aria-label*="Emoji"], button[aria-label*="emoji"]'
    ) as HTMLElement | null;

    if (emojiButton) return emojiButton;

    // Alternative: look for photo button
    const photoButton = toolbar.querySelector(
      'button[aria-label*="photo"], button[aria-label*="Photo"], button[aria-label*="image"]'
    ) as HTMLElement | null;

    if (photoButton) return photoButton;

    // Last resort: find any button with aria-label
    const firstButton = toolbar.querySelector("button") as HTMLElement | null;
    if (firstButton) return firstButton;

    return null;
  }

  /**
   * Create the AI Comment button
   */
  private createAIButton(): HTMLElement {
    const button = document.createElement("button");
    button.setAttribute(AI_BUTTON_DATA_ATTR, "true");
    button.setAttribute("type", "button");
    button.setAttribute("aria-label", "Generate AI comment");
    button.title = "Generate AI comment with LinkAI";

    // Style to match LinkedIn toolbar
    button.style.cssText = `
      background: none;
      border: none;
      padding: 8px 12px;
      margin: 0 2px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #65676b;
      font-size: 16px;
      line-height: 1;
      transition: all 0.2s ease;
      position: relative;
    `;

    // Hover effect
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#f0f2f5";
      button.style.color = "#0a66c2";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "transparent";
      button.style.color = "#65676b";
    });

    // Icon: Sparkles
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v6m0 6v6M3 12h6m6 0h6M5.64 5.64l4.24 4.24m2.24-4.24l4.24 4.24M5.64 18.36l4.24-4.24m2.24 4.24l4.24-4.24"/>
      </svg>
    `;

    return button;
  }

  /**
   * Check if button already exists for editor
   */
  hasButton(editor: HTMLElement): boolean {
    return this.injectedButtons.has(editor);
  }

  /**
   * Clean up all injected buttons
   */
  cleanup(): void {
    this.injectedButtons.forEach(({ button }) => button.remove());
    this.injectedButtons.clear();
    this.clickListeners.clear();
  }
}

export const commentButtonInjector = new CommentButtonInjector();
