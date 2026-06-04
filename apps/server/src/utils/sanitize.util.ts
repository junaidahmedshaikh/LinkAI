import sanitizeHtml from "sanitize-html";

export function sanitizeText(input: string, maxLength = 5000): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .trim()
    .slice(0, maxLength);
}

export function sanitizeStringArray(arr: string[], maxItems = 50): string[] {
  return arr
    .map((item) => sanitizeText(item, 200))
    .filter(Boolean)
    .slice(0, maxItems);
}
