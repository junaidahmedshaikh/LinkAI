import { describe, expect, it, beforeEach } from "vitest";
import { insertIntoLinkedInEditor } from "@/content/utils/prosemirror-insert";

describe("prosemirror-insert", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("inserts text into a ProseMirror-style editor", () => {
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    const paragraph = document.createElement("p");
    editor.appendChild(paragraph);
    document.body.appendChild(editor);

    const ok = insertIntoLinkedInEditor(editor, "Great insight!");
    expect(ok).toBe(true);
    expect(paragraph.textContent).toBe("Great insight!");
  });

  it("returns false for empty content", () => {
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    document.body.appendChild(editor);
    expect(insertIntoLinkedInEditor(editor, "   ")).toBe(false);
  });
});
