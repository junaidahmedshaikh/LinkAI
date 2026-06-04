import crypto from "crypto";
import { Session } from "../models/Session.model";
import { hashToken } from "../utils/jwt.util";
import type { DeviceType, ISessionDevice } from "@linkai/types";

function parseBrowser(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  return userAgent.slice(0, 80);
}

class SessionService {
  generateDeviceId(): string {
    return crypto.randomUUID();
  }

  serialize(session: {
    _id: unknown;
    userId: unknown;
    deviceId: string;
    deviceType: DeviceType;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ISessionDevice {
    return {
      _id: String(session._id),
      userId: String(session.userId),
      deviceId: session.deviceId,
      deviceType: session.deviceType,
      browser: session.browser ?? parseBrowser(session.userAgent),
      ipAddress: session.ipAddress,
      isActive: session.isActive,
      lastActiveAt: session.lastActiveAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  async upsertSession(input: {
    userId: string;
    deviceId: string;
    deviceType: DeviceType;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    refreshToken?: string;
  }): Promise<ISessionDevice> {
    const refreshTokenHash = input.refreshToken ? hashToken(input.refreshToken) : undefined;
    const session = await Session.findOneAndUpdate(
      { userId: input.userId, deviceId: input.deviceId },
      {
        userId: input.userId,
        deviceId: input.deviceId,
        deviceType: input.deviceType,
        browser: input.browser ?? parseBrowser(input.userAgent),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        refreshTokenHash,
        isActive: true,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return this.serialize(session);
  }

  async touchSession(sessionId: string): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, { lastActiveAt: new Date() });
  }

  async touchByDevice(userId: string, deviceId: string): Promise<void> {
    await Session.findOneAndUpdate(
      { userId, deviceId, isActive: true },
      { lastActiveAt: new Date() }
    );
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await Session.findById(sessionId).select("isActive");
    return !!session?.isActive;
  }

  async getActiveSessions(userId: string, limit = 50): Promise<ISessionDevice[]> {
    const sessions = await Session.find({ userId }).sort({ lastActiveAt: -1 }).limit(limit).lean();
    return sessions.map((s) =>
      this.serialize({
        ...s,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })
    );
  }

  async getExtensionSession(userId: string): Promise<ISessionDevice | null> {
    const session = await Session.findOne({
      userId,
      deviceType: "EXTENSION",
      isActive: true,
    })
      .sort({ lastActiveAt: -1 })
      .lean();
    return session
      ? this.serialize({
          ...session,
          lastActiveAt: session.lastActiveAt,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })
      : null;
  }

  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      { isActive: false, refreshTokenHash: undefined },
      { new: true }
    );
    return !!result;
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await Session.updateMany(
      { userId },
      { isActive: false, $unset: { refreshTokenHash: 1 } }
    );
  }

  async revokeByDeviceType(userId: string, deviceType: DeviceType): Promise<void> {
    await Session.updateMany(
      { userId, deviceType },
      { isActive: false, $unset: { refreshTokenHash: 1 } }
    );
  }

  async verifyRefreshForSession(sessionId: string, refreshToken: string): Promise<boolean> {
    const session = await Session.findById(sessionId).select("+refreshTokenHash isActive");
    if (!session?.isActive || !session.refreshTokenHash) return false;
    return session.refreshTokenHash === hashToken(refreshToken);
  }

  async updateRefreshHash(sessionId: string, refreshToken: string): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, {
      refreshTokenHash: hashToken(refreshToken),
      lastActiveAt: new Date(),
    });
  }
}

export const sessionService = new SessionService();
