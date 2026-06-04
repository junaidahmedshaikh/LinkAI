const COMMENT_SELECTORS = [
  'div[contenteditable="true"][aria-label*="comment" i]',
  'div[contenteditable="true"][data-placeholder*="comment" i]',
  ".comments-comment-box__form div[contenteditable]",
  ".comments-comment-texteditor div[contenteditable]",
  ".ql-editor[contenteditable='true']",
  'div[role="textbox"][contenteditable="true"]',
];

function dispatchInput(el: HTMLElement): void {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setContentEditableText(el: HTMLElement, text: string): void {
  el.focus();
  el.textContent = text;
  dispatchInput(el);
}

export function insertCommentText(text: string): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (active?.isContentEditable) {
    setContentEditableText(active, text);
    return true;
  }

  for (const selector of COMMENT_SELECTORS) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el?.isContentEditable) {
      setContentEditableText(el, text);
      return true;
    }
  }

  const openCommentBtn = document.querySelector(
    'button[aria-label*="Comment" i], button[aria-label*="comment" i]'
  ) as HTMLButtonElement | null;
  if (openCommentBtn) {
    openCommentBtn.click();
    for (const selector of COMMENT_SELECTORS) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el?.isContentEditable) {
        setTimeout(() => setContentEditableText(el, text), 300);
        return true;
      }
    }
  }

  return false;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
