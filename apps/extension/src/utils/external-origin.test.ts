import { describe, expect, it, vi } from "vitest";
import { isAllowedExternalSender } from "@/utils/external-origin";

vi.mock("@/utils/config", () => ({
  getAllowedExternalOrigins: () => [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
}));

describe("external-origin", () => {
  it("allows messages from configured web origin", () => {
    expect(
      isAllowedExternalSender({ url: "http://localhost:5173/dashboard" })
    ).toBe(true);
  });

  it("rejects messages from unknown origins", () => {
    expect(
      isAllowedExternalSender({ url: "https://evil.example/phish" })
    ).toBe(false);
  });

  it("rejects messages without sender url", () => {
    expect(isAllowedExternalSender({})).toBe(false);
  });
});
