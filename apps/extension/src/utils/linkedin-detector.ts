import type { LinkedInPageType } from "@linkai/types";

export function detectLinkedInPageType(url: string): LinkedInPageType {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("linkedin.com")) return "unknown";
    const path = parsed.pathname;

    if (/\/in\/[^/]+/.test(path)) return "profile";
    if (/\/company\/[^/]+/.test(path)) return "company";
    if (/\/jobs\/view\//.test(path) || /\/jobs\/collections/.test(path)) return "job";
    if (path.startsWith("/jobs")) return "jobs";
    if (path.startsWith("/messaging")) return "messaging";
    if (/\/posts\//.test(path) || /\/feed\/update\//.test(path)) return "post";
    if (path.startsWith("/search")) return "search";
    if (path === "/feed" || path === "/" || path.startsWith("/feed/")) return "feed";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function isLinkedInUrl(url?: string): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.includes("linkedin.com");
  } catch {
    return false;
  }
}
