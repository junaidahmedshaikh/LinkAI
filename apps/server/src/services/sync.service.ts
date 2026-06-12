import { User } from "../models/User.model";
import { authService } from "./auth.service";
import { settingsService } from "./settings.service";
import { permissionService } from "./permission.service";
import { featureFlagService } from "./feature-flag.service";
import { sessionService } from "./session.service";
import { cacheService, cacheKeys } from "./cache.service";
import type {
  IExtensionConnectPayload,
  IExtensionConnectResponse,
  IExtensionStatus,
  ISyncUserResponse,
  ISyncHeartbeatPayload,
  ISyncHeartbeatResponse,
  IUser,
} from "@linkai/types";

const SYNC_VERSION = "1.0.0";

class UserContextService {
  async getExtensionStatus(userId: string): Promise<IExtensionStatus> {
    const [settings, extSession] = await Promise.all([
      settingsService.getOrCreate(userId),
      sessionService.getExtensionSession(userId),
    ]);
    const meta = settings.extensionMeta;
    return {
      connected: !!extSession?.isActive,
      lastHeartbeatAt: meta?.lastHeartbeatAt?.toISOString(),
      lastVersion: meta?.lastVersion,
      lastLinkedInPage: meta?.lastLinkedInPage,
      lastLinkedInUrl: meta?.lastLinkedInUrl,
      activeSessionId: extSession?._id,
    };
  }

  async getSyncUser(userId: string, useCache = true): Promise<ISyncUserResponse> {
    const cacheKey = cacheKeys.syncUser(userId);
    if (useCache) {
      const cached = cacheService.get<ISyncUserResponse>(cacheKey);
      if (cached) return cached;
    }

    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error("User not found");

    const [settings, permissions, featureFlags, extensionStatus] =
      await Promise.all([
        settingsService.getOrCreate(userId),
        permissionService.getOrCreate(userId),
        featureFlagService.getAll(),
        this.getExtensionStatus(userId),
      ]);

    const payload: ISyncUserResponse = {
      user: authService.sanitizeUser(userDoc) as IUser,
      settings: settingsService.serialize(settings),
      usage: { ...settings.usageStats },
      permissions,
      featureFlags,
      extensionStatus,
      syncVersion: SYNC_VERSION,
      serverTime: new Date().toISOString(),
    };

    cacheService.set(cacheKey, payload, 2 * 60 * 1000);
    return payload;
  }

  invalidateUser(userId: string): void {
    cacheService.delete(cacheKeys.syncUser(userId));
    cacheService.delete(cacheKeys.permissions(userId));
  }
}

export const userContextService = new UserContextService();

class SyncService {
  getUser(userId: string) {
    return userContextService.getSyncUser(userId);
  }

  async getSettings(userId: string) {
    const settings = await settingsService.getOrCreate(userId);
    return settingsService.serialize(settings);
  }

  async getUsage(userId: string) {
    const settings = await settingsService.getOrCreate(userId);
    return { ...settings.usageStats };
  }

  async getPermissions(userId: string) {
    return permissionService.getOrCreate(userId);
  }

  async getFeatureFlags() {
    return featureFlagService.getAll();
  }

  async connectExtension(
    userId: string,
    payload: IExtensionConnectPayload,
    meta?: { ip?: string; userAgent?: string; refreshToken?: string }
  ): Promise<IExtensionConnectResponse> {
    const session = await sessionService.upsertSession({
      userId,
      deviceId: payload.deviceId,
      deviceType: "EXTENSION",
      browser: payload.browser ?? "Chrome Extension",
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      refreshToken: meta?.refreshToken,
    });

    userContextService.invalidateUser(userId);

    const sync = await userContextService.getSyncUser(userId, false);
    return {
      sessionId: session._id,
      user: sync.user,
      settings: sync.settings,
      usage: sync.usage,
      permissions: sync.permissions,
      featureFlags: sync.featureFlags,
      syncVersion: SYNC_VERSION,
      serverTime: new Date().toISOString(),
    };
  }

  async disconnectExtension(userId: string, deviceId: string): Promise<void> {
    const sessions = await sessionService.getActiveSessions(userId);
    const target = sessions.find((s) => s.deviceId === deviceId && s.deviceType === "EXTENSION");
    if (target) {
      await sessionService.revokeSession(target._id, userId);
    }
    userContextService.invalidateUser(userId);
  }

  async heartbeat(
    userId: string,
    payload: ISyncHeartbeatPayload
  ): Promise<ISyncHeartbeatResponse> {
    await sessionService.touchByDevice(userId, payload.deviceId);
    const settings = await settingsService.getOrCreate(userId);
    settings.extensionMeta = {
      ...settings.extensionMeta,
      lastHeartbeatAt: new Date(),
      lastVersion: payload.extensionVersion,
      lastLinkedInPage: payload.linkedInPage,
      lastLinkedInUrl: payload.linkedInUrl?.slice(0, 500),
    };
    await settings.save({ validateBeforeSave: false });
    userContextService.invalidateUser(userId);

    const extensionStatus = await userContextService.getExtensionStatus(userId);
    return {
      ok: true,
      serverTime: new Date().toISOString(),
      syncVersion: SYNC_VERSION,
      extensionStatus,
    };
  }
}

export const syncService = new SyncService();
