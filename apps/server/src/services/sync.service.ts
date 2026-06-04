import { User } from "../models/User.model";
import { Profile } from "../models/Profile.model";
import { Resume } from "../models/Resume.model";
import { LinkedInProfile } from "../models/LinkedInProfile.model";
import { authService } from "./auth.service";
import { settingsService } from "./settings.service";
import { activityService } from "./activity.service";
import { permissionService } from "./permission.service";
import { featureFlagService } from "./feature-flag.service";
import { sessionService } from "./session.service";
import { cacheService, cacheKeys } from "./cache.service";
import { profileService } from "./profile.service";
import { linkedInProfileService } from "./linkedin-profile.service";
import { resumeService } from "./resume.service";
import type {
  IExtensionConnectPayload,
  IExtensionConnectResponse,
  IExtensionStatus,
  ISyncProfileResponse,
  ISyncResumeResponse,
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

  async buildDashboardStats(userId: string) {
    const [profile, resumeCount, linkedin] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      Resume.countDocuments({ userId }),
      LinkedInProfile.findOne({ userId }).lean(),
    ]);
    const linkedinConnected = !!(linkedin?.linkedinUrl && linkedin.linkedinUrl.length > 0);
    return {
      profileCompletion: profile?.profileScore ?? 0,
      resumeCount,
      resumeUploaded: resumeCount > 0,
      linkedinConnected,
      linkedinProfileScore: linkedin?.profileScore ?? 0,
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

    const [profile, settings, permissions, featureFlags, recentActivities, dashboardStats, extensionStatus] =
      await Promise.all([
        Profile.findOne({ userId }).lean(),
        settingsService.getOrCreate(userId),
        permissionService.getOrCreate(userId),
        featureFlagService.getAll(),
        activityService.getRecent(userId, 10),
        this.buildDashboardStats(userId),
        this.getExtensionStatus(userId),
      ]);

    const payload: ISyncUserResponse = {
      user: authService.sanitizeUser(userDoc) as IUser,
      profile: profile ? profileService.serialize(profile) : null,
      settings: settingsService.serialize(settings),
      usage: { ...settings.usageStats },
      permissions,
      featureFlags,
      recentActivities,
      dashboardStats,
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
    cacheService.delete(cacheKeys.profile(userId));
  }
}

export const userContextService = new UserContextService();

class SyncService {
  getUser(userId: string) {
    return userContextService.getSyncUser(userId);
  }

  async getProfile(userId: string): Promise<ISyncProfileResponse> {
    const [profile, linkedinDoc] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      LinkedInProfile.findOne({ userId }),
    ]);
    const linkedinProfile = linkedinDoc ? linkedInProfileService.serialize(linkedinDoc) : null;
    return {
      profile: profile ? profileService.serialize(profile) : null,
      linkedinProfile,
      profileCompletion: profile?.profileScore ?? 0,
      linkedinConnected: !!(linkedinDoc?.linkedinUrl && linkedinDoc.linkedinUrl.length > 0),
      lastSyncedAt: linkedinDoc?.lastSyncedAt?.toISOString(),
    };
  }

  async getSettings(userId: string) {
    const settings = await settingsService.getOrCreate(userId);
    return settingsService.serialize(settings);
  }

  async getUsage(userId: string) {
    const settings = await settingsService.getOrCreate(userId);
    return { ...settings.usageStats };
  }

  async getActivity(userId: string, limit = 20) {
    return activityService.getRecent(userId, limit);
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
      profile: sync.profile,
      settings: sync.settings,
      usage: sync.usage,
      permissions: sync.permissions,
      featureFlags: sync.featureFlags,
      recentActivities: sync.recentActivities,
      dashboardStats: {
        profileCompletion: sync.dashboardStats.profileCompletion,
        resumeCount: sync.dashboardStats.resumeCount,
        linkedinConnected: sync.dashboardStats.linkedinConnected,
        linkedinProfileScore: sync.dashboardStats.linkedinProfileScore,
      },
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

  async getResumes(userId: string): Promise<ISyncResumeResponse> {
    const docs = await resumeService.list(userId);
    const resumes = docs.map((d) => resumeService.serialize(d));
    const primary = resumes.find((r) => r.isPrimary) ?? resumes[0] ?? null;
    return { resumes, primaryResume: primary, resumeCount: resumes.length };
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
