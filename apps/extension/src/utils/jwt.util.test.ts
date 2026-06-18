import { describe, expect, it } from "vitest";
import { decodeJwtPayload, isAccessTokenValid } from "@/utils/jwt.util";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("jwt.util", () => {
  it("decodes JWT payload", () => {
    const token = makeJwt({ exp: 9999999999, userId: "abc" });
    expect(decodeJwtPayload(token)?.userId).toBe("abc");
  });

  it("validates non-expired access token", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ exp: future });
    expect(isAccessTokenValid(token)).toBe(true);
  });

  it("rejects expired access token", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const token = makeJwt({ exp: past });
    expect(isAccessTokenValid(token)).toBe(false);
  });
});
