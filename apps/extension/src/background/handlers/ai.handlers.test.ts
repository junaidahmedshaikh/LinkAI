import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleGenerateComment } from "@/background/handlers/ai.handlers";

vi.mock("@/services/ai-comment.service", () => ({
  aiCommentService: {
    generate: vi.fn().mockResolvedValue({ comment: { text: "Nice post!" } }),
  },
}));

vi.mock("@/services/usage.service", () => ({
  usageService: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("ai.handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates comment from panel source", async () => {
    const res = await handleGenerateComment(
      {
        postContent: "Hello world from LinkedIn",
        tone: "professional",
      },
      "panel"
    );
    expect(res.success).toBe(true);
    expect(res.data).toMatchObject({ comment: { text: "Nice post!" } });
  });

  it("returns error when generation throws", async () => {
    const { aiCommentService } = await import("@/services/ai-comment.service");
    vi.mocked(aiCommentService.generate).mockRejectedValueOnce(new Error("Limit reached"));

    const res = await handleGenerateComment(
      { postContent: "Hello world from LinkedIn", tone: "friendly" },
      "inline"
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe("Limit reached");
  });
});
