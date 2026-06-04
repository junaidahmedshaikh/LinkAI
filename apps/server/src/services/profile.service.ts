import { Profile, IProfileDocument } from "../models/Profile.model";
import { User } from "../models/User.model";
import { calculateProfileScore } from "../utils/profileScore.util";
import { sanitizeText, sanitizeStringArray } from "../utils/sanitize.util";
import { activityService } from "./activity.service";
import { userContextService } from "./sync.service";
import { getStorageProvider } from "./storage";
import type { IProfile } from "@linkai/types";
import path from "path";
import { env } from "../config/env";

class ProfileService {
  async getOrCreate(userId: string): Promise<IProfileDocument> {
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      const user = await User.findById(userId);
      const names = user?.fullName?.split(" ") ?? [];
      profile = await Profile.create({
        userId,
        firstName: names[0],
        lastName: names.slice(1).join(" ") || undefined,
        skills: [],
        profileScore: 0,
      });
    }
    return profile;
  }

  async update(userId: string, data: Partial<IProfileDocument>): Promise<IProfileDocument> {
    const profile = await this.getOrCreate(userId);

    const updatable: Partial<IProfileDocument> = {};
    if (data.firstName !== undefined) updatable.firstName = sanitizeText(data.firstName, 60);
    if (data.lastName !== undefined) updatable.lastName = sanitizeText(data.lastName, 60);
    if (data.headline !== undefined) updatable.headline = sanitizeText(data.headline, 220);
    if (data.position !== undefined) updatable.position = sanitizeText(data.position, 120);
    if (data.company !== undefined) updatable.company = sanitizeText(data.company, 120);
    if (data.industry !== undefined) updatable.industry = sanitizeText(data.industry, 80);
    if (data.location !== undefined) updatable.location = sanitizeText(data.location, 120);
    if (data.experienceYears !== undefined) updatable.experienceYears = data.experienceYears;
    if (data.skills !== undefined) updatable.skills = sanitizeStringArray(data.skills);
    if (data.website !== undefined) updatable.website = sanitizeText(data.website, 300);
    if (data.github !== undefined) updatable.github = sanitizeText(data.github, 300);
    if (data.portfolio !== undefined) updatable.portfolio = sanitizeText(data.portfolio, 300);
    if (data.bio !== undefined) updatable.bio = sanitizeText(data.bio, 2000);
    if (data.linkedinUrl !== undefined) updatable.linkedinUrl = sanitizeText(data.linkedinUrl, 300);

    Object.assign(profile, updatable);
    profile.profileScore = calculateProfileScore(profile);
    await profile.save();

    await activityService.log(userId, "PROFILE_UPDATED", "Profile information updated");
    userContextService.invalidateUser(userId);
    return profile;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<IProfileDocument> {
    const storage = getStorageProvider();
    const stored = await storage.save(file, `${userId}/avatars`);
    const profile = await this.getOrCreate(userId);

    if (profile.avatar) {
      const oldPath = path.join(env.UPLOAD_DIR, profile.avatar.replace("/uploads/", ""));
      await storage.delete(oldPath);
    }

    profile.avatar = stored.publicUrl;
    profile.profileScore = calculateProfileScore(profile);
    await profile.save();

    await User.findByIdAndUpdate(userId, { avatar: stored.publicUrl });
    await activityService.log(userId, "AVATAR_UPLOADED", "Profile picture updated");
    return profile;
  }

  async deleteAvatar(userId: string): Promise<IProfileDocument> {
    const profile = await this.getOrCreate(userId);
    if (profile.avatar) {
      const storage = getStorageProvider();
      const oldPath = path.join(env.UPLOAD_DIR, profile.avatar.replace("/uploads/", ""));
      await storage.delete(oldPath);
      profile.avatar = undefined;
      profile.profileScore = calculateProfileScore(profile);
      await profile.save();
      await User.findByIdAndUpdate(userId, { avatar: "" });
      await activityService.log(userId, "AVATAR_DELETED", "Profile picture removed");
    }
    return profile;
  }

  async getPublicProfile(userId: string): Promise<IProfile | null> {
    const profile = await Profile.findOne({ userId }).lean();
    if (!profile) return null;
    return this.serialize(profile);
  }

  serialize(doc: IProfileDocument | Record<string, unknown>): IProfile {
    const d = doc as IProfileDocument;
    return {
      _id: d._id.toString(),
      userId: d.userId.toString(),
      firstName: d.firstName,
      lastName: d.lastName,
      headline: d.headline,
      position: d.position,
      company: d.company,
      industry: d.industry,
      location: d.location,
      experienceYears: d.experienceYears,
      skills: d.skills ?? [],
      website: d.website,
      github: d.github,
      portfolio: d.portfolio,
      bio: d.bio,
      avatar: d.avatar,
      linkedinUrl: d.linkedinUrl,
      profileScore: d.profileScore,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}

export const profileService = new ProfileService();
