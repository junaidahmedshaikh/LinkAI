import type { ILinkedInPostExtract } from "@linkai/types";

function text(el: Element | null): string | undefined {
  const t = el?.textContent?.trim();
  return t && t.length > 0 ? t.slice(0, 5000) : undefined;
}

function sanitize(str?: string): string | undefined {
  if (!str) return undefined;
  return str.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
}

function postIdFromArticle(article: Element): string | undefined {
  const urn = article.getAttribute("data-urn") ?? article.querySelector("[data-urn]")?.getAttribute("data-urn");
  if (urn) return urn;
  const link = article.querySelector('a[href*="/feed/update/"]') as HTMLAnchorElement | null;
  return link?.href;
}

export function extractPostFromArticle(article: Element): ILinkedInPostExtract {
  const content = text(
    article.querySelector(
      ".feed-shared-text, .update-components-text, .feed-shared-inline-show-more-text, .break-words"
    ) ?? null
  );
  const author = text(
    article.querySelector(
      ".update-components-actor__name, .feed-shared-actor__name, .update-components-actor__title"
    ) ?? null
  );
  const postUrl =
    (article.querySelector('a[href*="/feed/update/"]') as HTMLAnchorElement | null)?.href ??
    window.location.href;

  return {
    url: postUrl,
    author: sanitize(author),
    content: sanitize(content),
    postId: postIdFromArticle(article),
    extractedAt: new Date().toISOString(),
  };
}

/** Post most visible in the viewport (feed scroll). */
export function extractActivePost(doc: Document = document): ILinkedInPostExtract | null {
  const articles = Array.from(
    doc.querySelectorAll("article, .feed-shared-update-v2, div[data-urn*='activity']")
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.height > 80 && rect.top < window.innerHeight && rect.bottom > 80;
  });

  if (articles.length === 0) return null;

  let best = articles[0];
  let bestScore = -1;
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const visible = Math.max(0, visibleBottom - visibleTop);
    const score = visible / Math.max(rect.height, 1);
    if (score > bestScore) {
      bestScore = score;
      best = article;
    }
  }

  const extracted = extractPostFromArticle(best);
  return extracted.content ? extracted : null;
}

export function extractAllVisiblePosts(doc: Document = document): ILinkedInPostExtract[] {
  const articles = Array.from(doc.querySelectorAll("article, .feed-shared-update-v2"));
  return articles
    .map((a) => extractPostFromArticle(a))
    .filter((p) => p.content && p.content.length > 10)
    .slice(0, 5);
}
