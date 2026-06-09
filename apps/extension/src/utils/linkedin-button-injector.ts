import { persistDebugLog } from "@/utils/debug";
import { commentWidget } from "./comment-widget";

// const BUTTON_ID = "linkai-generate-comment-btn";
const BUTTON_CLASS = "linkai-comment-button";

interface PostElement {
  element: Element;
  postId?: string;
}

class LinkedInButtonInjector {
  private observer: MutationObserver | null = null;
  private injectedPosts = new Set<string>();
  private enabled = false;

  /**
   * Start injecting buttons on LinkedIn posts
   */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    // Inject on page posts
    this.injectButtonsOnCurrentPosts();

    // Watch for new posts (infinite scroll)
    this.setupMutationObserver();

    void persistDebugLog("injector", "started button injection");
  }

  /**
   * Stop injecting buttons
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.enabled = false;
    this.injectedPosts.clear();
  }

  /**
   * Find all post elements on the page
   */
  private findPostElements(): PostElement[] {
    const posts: PostElement[] = [];
    const selectors = ["article", ".feed-shared-update-v2", "div[data-urn*='activity']"];

    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      for (const element of elements) {
        // Skip if already has our button
        if (element.querySelector(`.${BUTTON_CLASS}`)) continue;

        const postId = this.extractPostId(element);
        posts.push({ element, postId });
      }
    }

    return posts;
  }

  /**
   * Extract post ID from element
   */
  private extractPostId(element: Element): string | undefined {
    const urn = element.getAttribute("data-urn");
    if (urn) return urn;

    const link = element.querySelector('a[href*="/feed/update/"]') as HTMLAnchorElement | null;
    if (link?.href) return link.href;

    return `post-${Date.now()}-${Math.random()}`;
  }

  /**
   * Create the generate comment button
   */
  private createButton(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = `${BUTTON_CLASS} linkai-btn`;
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", "Generate AI comment");
    btn.title = "Generate AI comment with LinkAI";

    // Styling to match LinkedIn design
    btn.style.cssText = `
      padding: 6px 12px;
      margin: 0 4px;
      background: linear-gradient(135deg, #0a66c2 0%, #0855a8 100%);
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    `;

    // Hover effect
    btn.addEventListener("mouseover", () => {
      btn.style.background = "linear-gradient(135deg, #0855a8 0%, #064494 100%)";
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.3)";
    });

    btn.addEventListener("mouseout", () => {
      btn.style.background = "linear-gradient(135deg, #0a66c2 0%, #0855a8 100%)";
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "none";
    });

    // Icon SVG
    const icon = document.createElement("span");
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></svg>`;
    btn.appendChild(icon);

    const text = document.createElement("span");
    text.textContent = "AI Comment";
    btn.appendChild(text);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleGenerateClick();
    });

    return btn;
  }

  /**
   * Inject button into a post element
   */
  private injectButtonIntoPost(post: PostElement): void {
    const postId = post.postId || `post-${Date.now()}`;

    // Skip if already injected
    if (this.injectedPosts.has(postId)) return;

    // Find the action bar (usually at the bottom of the post)
    const actionBar = post.element.querySelector(
      ".social-details-social-counts, [data-test-id='post-actions'], .update-components-footer"
    ) as HTMLElement | null;

    if (!actionBar) return;

    // Look for a suitable place to insert the button
    const actionButtons = actionBar.querySelector(".social-actions, [data-test-id='like-button']");
    if (!actionButtons) return;

    // Create a wrapper for our button
    const wrapper = document.createElement("div");
    wrapper.className = BUTTON_CLASS;
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";

    wrapper.appendChild(this.createButton());

    // Insert before the action buttons or at the beginning
    if (actionButtons) {
      actionButtons.parentElement?.insertBefore(wrapper, actionButtons);
    } else {
      actionBar.insertBefore(wrapper, actionBar.firstChild);
    }

    this.injectedPosts.add(postId);
  }

  /**
   * Inject buttons on all current posts
   */
  private injectButtonsOnCurrentPosts(): void {
    const posts = this.findPostElements();
    for (const post of posts) {
      this.injectButtonIntoPost(post);
    }
  }

  /**
   * Setup mutation observer for infinite scroll
   */
  private setupMutationObserver(): void {
    if (this.observer) this.observer.disconnect();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    this.observer = new MutationObserver(() => {
      if (!this.enabled) return;
      if (document.visibilityState !== "visible") return;

      // Debounce to avoid excessive processing
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.injectButtonsOnCurrentPosts();
      }, 500);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  /**
   * Handle generate button click
   */
  private handleGenerateClick(): void {
    // Find the post near the clicked button
    const btn = event?.target as HTMLElement;
    const post = btn?.closest("article, .feed-shared-update-v2, div[data-urn*='activity']");

    if (post) {
      // Scroll to make the post visible
      post.scrollIntoView({ behavior: "smooth", block: "center" });

      // Show the floating widget next to the post
      commentWidget.show(post as HTMLElement);

      void persistDebugLog("injector", "Opened floating comment widget");
    }
  }
}

export const linkedInButtonInjector = new LinkedInButtonInjector();
