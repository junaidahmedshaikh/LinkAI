import { logger } from "@/utils/logger";

const COMMENT_SELECTORS = [
  'div[contenteditable="true"][aria-label*="comment" i]',
  'div[contenteditable="true"][data-placeholder*="comment" i]',
  ".comments-comment-box__form div[contenteditable]",
  ".comments-comment-texteditor div[contenteditable]",
  ".ql-editor[contenteditable='true']",
  'div[role="textbox"][contenteditable="true"]',
];

const CURSOR_POSITION_DELAY_MS = 50;

function isEditableElement(el: HTMLElement): boolean {
  return el.isContentEditable || el.getAttribute("contenteditable") === "true";
}

function dispatchEditorEvents(editor: HTMLElement): void {
  editor.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
  editor.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  editor.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true }));
}

function insertIntoEditorElement(editor: HTMLElement, content: string): boolean {
  try {
    let paragraph = editor.querySelector("p");
    if (!paragraph) {
      paragraph = document.createElement("p");
      editor.innerHTML = "";
      editor.appendChild(paragraph);
    }

    paragraph.innerHTML = "";
    paragraph.textContent = content;
    paragraph.classList.remove("is-empty", "is-editor-empty");
    paragraph.removeAttribute("data-placeholder");

    editor.focus();

    try {
      const range = document.createRange();
      const sel = window.getSelection();
      if (sel && paragraph.firstChild) {
        range.setStart(paragraph.firstChild, content.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch {
      // Selection API may be unavailable in some environments
    }

    dispatchEditorEvents(editor);
    try {
      editor.blur();
      setTimeout(() => editor.focus(), CURSOR_POSITION_DELAY_MS);
    } catch {
      // jsdom may not support focus/blur in all environments
    }

    logger.log("prosemirror-insert", "Inserted content", { length: content.length });
    return true;
  } catch (error) {
    logger.error(
      "prosemirror-insert",
      error instanceof Error ? error.message : "Insert failed"
    );
    return false;
  }
}

function setContentEditableText(el: HTMLElement, text: string): boolean {
  el.focus();
  if (el.querySelector("p")) {
    return insertIntoEditorElement(el, text);
  }
  el.textContent = text;
  dispatchEditorEvents(el);
  return true;
}

/**
 * Insert plain text into a LinkedIn ProseMirror / contenteditable comment editor.
 */
export function insertIntoLinkedInEditor(
  editor: HTMLElement | null | undefined,
  content: string
): boolean {
  if (!content.trim()) return false;

  if (editor && isEditableElement(editor)) {
    return insertIntoEditorElement(editor, content);
  }

  const active = document.activeElement as HTMLElement | null;
  if (active && isEditableElement(active)) {
    return setContentEditableText(active, content);
  }

  for (const selector of COMMENT_SELECTORS) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el && isEditableElement(el)) {
      return setContentEditableText(el, content);
    }
  }

  const openCommentBtn = document.querySelector(
    'button[aria-label*="Comment" i], button[aria-label*="comment" i]'
  ) as HTMLButtonElement | null;

  if (openCommentBtn) {
    openCommentBtn.click();
    for (const selector of COMMENT_SELECTORS) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el && isEditableElement(el)) {
        setTimeout(() => setContentEditableText(el, content), 300);
        return true;
      }
    }
  }

  return false;
}

/** Side-panel / message handler entry: find editor and insert. */
export function insertCommentText(text: string): boolean {
  return insertIntoLinkedInEditor(undefined, text);
}
