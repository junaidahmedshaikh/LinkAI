import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  handleAuthLogin,
  handleAuthRegister,
  handleAuthLogout,
} from "@/background/handlers/auth.handlers";

vi.mock("@/services/auth.service", () => ({
  authService: {
    login: vi.fn().mockResolvedValue({ _id: "1", email: "a@test.com", fullName: "Test" }),
    register: vi.fn().mockResolvedValue({ _id: "2", email: "b@test.com", fullName: "New" }),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/sync.service", () => ({
  syncService: {
    connect: vi.fn().mockResolvedValue(null),
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/usage.service", () => ({
  usageService: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}));

const ctx = {
  startHeartbeat: vi.fn(),
  stopHeartbeat: vi.fn(),
};

describe("auth.handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user on login", async () => {
    const res = await handleAuthLogin(
      { email: "a@test.com", password: "secret" },
      ctx
    );
    expect(res.success).toBe(true);
    expect(res.data).toMatchObject({ user: { email: "a@test.com" } });
    expect(ctx.startHeartbeat).toHaveBeenCalled();
  });

  it("returns user on register with consistent shape", async () => {
    const res = await handleAuthRegister(
      { fullName: "New", email: "b@test.com", password: "Secret123" },
      ctx
    );
    expect(res.success).toBe(true);
    expect((res.data as { user: { email: string } }).user.email).toBe("b@test.com");
    expect(ctx.startHeartbeat).toHaveBeenCalled();
  });

  it("stops heartbeat on logout", async () => {
    const res = await handleAuthLogout(undefined, ctx);
    expect(res.success).toBe(true);
    expect(ctx.stopHeartbeat).toHaveBeenCalled();
  });
});
