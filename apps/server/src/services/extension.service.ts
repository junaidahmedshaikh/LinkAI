import { User } from "../models/User.model";
import { Profile } from "../models/Profile.model";
import { LinkedInProfile } from "../models/LinkedInProfile.model";
import { authService } from "./auth.service";
import { settingsService } from "./settings.service";
import { activityService } from "./activity.service";
import type {
  ExtensionActivityType,
  IExtensionHeartbeatPayload,
  IExtensionMeResponse,
  IUser,
  LinkedInPageType,
} from "@linkai/types";

class ExtensionService {
  async getMe(userId: string): Promise<IExtensionMeResponse> {
    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error("User not found");
    const user = authService.sanitizeUser(userDoc);

    const [profile, linkedin, settings] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      LinkedInProfile.findOne({ userId }).lean(),
      settingsService.getOrCreate(userId),
    ]);

    return {
      user: user as IUser,
      usageStats: { ...settings.usageStats },
      profileCompletion: profile?.profileScore ?? 0,
      linkedinConnected: !!(linkedin?.linkedinUrl && linkedin.linkedinUrl.length > 0),
    };
  }

  async getSettings(userId: string) {
    const settings = await settingsService.getOrCreate(userId);
    return settingsService.serialize(settings);
  }

  async logActivity(
    userId: string,
    type: ExtensionActivityType,
    action: string,
    metadata?: Record<string, unknown>
  ) {
    return activityService.log(userId, type, action, metadata);
  }

  async heartbeat(userId: string, payload: IExtensionHeartbeatPayload) {
    const settings = await settingsService.getOrCreate(userId);
    settings.extensionMeta = {
      ...settings.extensionMeta,
      lastHeartbeatAt: new Date(),
      lastVersion: payload.extensionVersion,
      lastLinkedInPage: payload.linkedInPage,
      lastLinkedInUrl: payload.linkedInUrl?.slice(0, 500),
    };
    await settings.save({ validateBeforeSave: false });

    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error("User not found");
    const user = authService.sanitizeUser(userDoc);

    return {
      ok: true,
      serverTime: new Date().toISOString(),
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
      },
      settings: {
        notifications: { ...settings.notifications },
        preferences: { ...settings.preferences },
      },
    };
  }
}

export const extensionService = new ExtensionService();
