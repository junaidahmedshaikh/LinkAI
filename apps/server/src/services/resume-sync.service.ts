import { Profile } from "../models/Profile.model";
import { profileService } from "./profile.service";
import { cacheService, cacheKeys } from "./cache.service";
import { eventService } from "./event.service";
import type { IProfile } from "@linkai/types";

class ResumeSyncService {
  invalidate(userId: string): void {
    cacheService.deleteByPrefix(`sync:user:${userId}`);
    cacheService.delete(cacheKeys.profile(userId));
    eventService.emit(userId, "RESUME_UPDATED");
  }
}

export const resumeSyncService = new ResumeSyncService();

class LinkedInSyncService {
  invalidate(userId: string): void {
    cacheService.deleteByPrefix(`sync:user:${userId}`);
    eventService.emit(userId, "LINKEDIN_CONNECTED");
  }
}

export const linkedinSyncService = new LinkedInSyncService();

class ProfileSyncHelper {
  async getProfile(userId: string): Promise<IProfile | null> {
    const profile = await Profile.findOne({ userId }).lean();
    return profile ? profileService.serialize(profile) : null;
  }

  invalidate(userId: string): void {
    cacheService.deleteByPrefix(`sync:user:${userId}`);
    cacheService.delete(cacheKeys.profile(userId));
    eventService.emit(userId, "PROFILE_UPDATED");
  }
}

export const profileSyncHelper = new ProfileSyncHelper();
