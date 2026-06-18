/**
 * Post Extractor
 * Extracts post data from LinkedIn feed items
 * Uses DOM hierarchy and semantic elements
 * Does NOT rely on CSS class names
 */

export interface ExtractedPostData {
  postText: string;
  authorName: string;
  authorHeadline: string;
  postUrl: string;
  mediaType: "text" | "image" | "video" | "mixed" | "unknown";
  hashtags: string[];
}

class PostExtractor {
  /**
   * Extract post data starting from comment editor
   * Traverses up to find post container, then extracts all data
   */
  extractPostFromEditor(editor: HTMLElement): ExtractedPostData {
    // Find post container
    const postElement = this.findPostContainer(editor);

    if (!postElement) {
      return this.getEmptyPost();
    }

    return this.extractPostData(postElement);
  }

  /**
   * Extract post data from a post element
   */
  extractPostData(postElement: HTMLElement): ExtractedPostData {
    return {
      postText: this.extractPostText(postElement),
      authorName: this.extractAuthorName(postElement),
      authorHeadline: this.extractAuthorHeadline(postElement),
      postUrl: this.extractPostUrl(postElement),
      mediaType: this.detectMediaType(postElement),
      hashtags: this.extractHashtags(postElement),
    };
  }

  /**
   * Find the main post container
   */
  private findPostContainer(startElement: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = startElement;
    const MAX_LEVELS = 60;

    // ===== STRATEGY 1: Look for <article> tag =====
    current = startElement;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;
      if (current.tagName === "ARTICLE") {
        return current;
      }
      current = current.parentElement;
    }

    // ===== STRATEGY 2: Look for semantic markers combination =====
    current = startElement;
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
    current = startElement;
    for (let i = 0; i < MAX_LEVELS; i++) {
      if (!current) break;

      if (current.getAttribute("role") === "article") {
        return current;
      }

      if (
        current.getAttribute("data-urn") ||
        current.getAttribute("data-feed-item-id")
      ) {
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

  /**
   * Extract main post text
   * Looks for text content elements that are not interactive
   */
  private extractPostText(postElement: HTMLElement): string {
    // Look for post content container
    const contentSelectors = [
      'div[role="region"] article',
      'div[data-urn*="activity"] div[role="region"]',
      'article div[role="region"]',
    ];

    for (const selector of contentSelectors) {
      const element = postElement.querySelector(selector) as HTMLElement | null;
      if (element) {
        const text = this.extractTextContent(element);
        if (text && text.length > 10) {
          return text;
        }
      }
    }

    // Fallback: get ALL text blocks and find the longest one (likely the post content)
    const paragraphs = postElement.querySelectorAll("p, div[role='paragraph'], div[class*='break-words']");
    
    let longestText = "";
    
    for (let para of paragraphs) {
      const text = this.extractTextContent(para as HTMLElement);
      // Skip very short text (likely names/metadata)
      if (text.length > longestText.length && text.length > 20) {
        longestText = text;
      }
    }
    
    if (longestText && longestText.length > 20) {
      return longestText;
    }

    // Last resort: get all text from post element, excluding buttons/metadata
    const allText = this.extractTextContent(postElement);
    
    // If we have reasonable content, use it
    if (allText && allText.length > 50) {
      return allText;
    }

    return "Post shared on LinkedIn";
  }

  /**
   * Extract author name
   * Looks for first link with profile URL or name in aria-label
   */
  private extractAuthorName(postElement: HTMLElement): string {
    // Look for author link (usually points to profile)
    const authorLinks = postElement.querySelectorAll(
      'a[href*="/in/"], a[href*="/company/"], a[data-test-id="feed__actor__name-button"]'
    );

    if (authorLinks.length > 0) {
      const text = this.extractTextContent(authorLinks[0] as HTMLElement);
      if (text) return text;
    }

    // Look for name in aria-label
    const nameElements = postElement.querySelectorAll("[aria-label*='posted']");
    if (nameElements.length > 0) {
      const ariaLabel = nameElements[0].getAttribute("aria-label") || "";
      // Extract name from "John Doe posted"
      const match = ariaLabel.match(/(.+?)\s+posted/i);
      if (match) return match[1];
    }

    return "Anonymous";
  }

  /**
   * Extract author headline/title
   * Looks for text near author name
   */
  private extractAuthorHeadline(postElement: HTMLElement): string {
    // Look for span containing job title or headline
    const headlineSelectors = [
      'span[data-test-id="feed__actor__subtitle"]',
      'div[class*="headline"]',
      'span[data-test-id*="headline"]',
    ];

    for (const selector of headlineSelectors) {
      const element = postElement.querySelector(selector) as HTMLElement | null;
      if (element) {
        const text = this.extractTextContent(element);
        if (text && text.length > 3) return text;
      }
    }

    return "LinkedIn Member";
  }

  /**
   * Extract post URL
   * Looks for permalink or post ID in data attributes
   */
  private extractPostUrl(postElement: HTMLElement): string {
    // Try to find permalink button
    const permalinkButton = postElement.querySelector(
      'a[aria-label*="Permalink"], a[href*="/feed/update/"]'
    ) as HTMLElement | null;

    if (permalinkButton) {
      const href = permalinkButton.getAttribute("href");
      if (href) {
        return href.startsWith("http") ? href : `https://linkedin.com${href}`;
      }
    }

    // Try data-urn attribute
    const dataUrn = postElement.getAttribute("data-urn");
    if (dataUrn) {
      // Extract activity ID from URN
      const match = dataUrn.match(/activity:(\d+)/i);
      if (match) {
        return `https://www.linkedin.com/feed/update/${match[1]}/`;
      }
    }

    return "https://www.linkedin.com/feed/";
  }

  /**
   * Detect media type in post
   */
  private detectMediaType(
    postElement: HTMLElement
  ): "text" | "image" | "video" | "mixed" | "unknown" {
    const hasImage = !!postElement.querySelector(
      'img[role="presentation"], img[alt*="image"], div[role="img"]'
    );
    const hasVideo = !!postElement.querySelector(
      'video, iframe[src*="youtube"], iframe[src*="vimeo"]'
    );

    if (hasImage && hasVideo) return "mixed";
    if (hasImage) return "image";
    if (hasVideo) return "video";
    if (postElement.innerText.length > 50) return "text";

    return "unknown";
  }

  /**
   * Extract hashtags from post text
   */
  private extractHashtags(postElement: HTMLElement): string[] {
    const text = this.extractPostText(postElement);
    const hashtagRegex = /#(\w+)/g;
    const matches = text.matchAll(hashtagRegex);
    return Array.from(matches).map((m) => m[1]);
  }

  /**
   * Extract text content, removing empty nodes
   */
  private extractTextContent(element: HTMLElement): string {
    const text = element.innerText || element.textContent || "";
    return text.trim().substring(0, 2000); // Limit to 2000 chars
  }

  /**
   * Get empty/default post data
   */
  private getEmptyPost(): ExtractedPostData {
    return {
      postText: "Post content",
      authorName: "Anonymous",
      authorHeadline: "LinkedIn Member",
      postUrl: "https://www.linkedin.com/feed/",
      mediaType: "unknown",
      hashtags: [],
    };
  }
}

export const postExtractor = new PostExtractor();
