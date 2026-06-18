export interface JwtPayload {
  exp?: number;
  iat?: number;
  userId?: string;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns true when access token exists and is not expired (30s skew). */
export function isAccessTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return token.length > 10;
  return Date.now() < payload.exp * 1000 - 30_000;
}

/** Returns true when refresh token string looks present (opaque JWT or random). */
export function isRefreshTokenPresent(token: string): boolean {
  return token.length > 10;
}
