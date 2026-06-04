import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  deviceType?: string;
  deviceId?: string;
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; hashedToken: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  return { token, hashedToken };
}

export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
