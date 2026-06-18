import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleSyncFetchUser } from "@/background/handlers/sync.handlers";

vi.mock("@/services/sync.service", () => ({
  syncService: {
    fetchUser: vi.fn(),
    getCachedOrFetch: vi.fn(),
  },
}));

import { syncService } from "@/services/sync.service";

describe("sync.handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns synced user data", async () => {
    vi.mocked(syncService.fetchUser).mockResolvedValue({
      user: { _id: "1", email: "a@test.com" },
    } as never);

    const res = await handleSyncFetchUser();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
  });

  it("falls back to cache when fetch fails", async () => {
    vi.mocked(syncService.fetchUser).mockRejectedValue(new Error("offline"));
    vi.mocked(syncService.getCachedOrFetch).mockResolvedValue({
      user: { _id: "1", email: "cached@test.com" },
    } as never);

    const res = await handleSyncFetchUser();
    expect(res.success).toBe(true);
  });
});
