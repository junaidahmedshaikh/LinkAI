import { LinkedInProfile, ILinkedInProfileDocument } from "../models/LinkedInProfile.model";
import { calculateLinkedInScore } from "../utils/profileScore.util";
import { sanitizeText, sanitizeStringArray } from "../utils/sanitize.util";
import { activityService } from "./activity.service";
import type { ILinkedInProfile } from "@linkai/types";

class LinkedInProfileService {
  async getOrCreate(userId: string): Promise<ILinkedInProfileDocument> {
    let profile = await LinkedInProfile.findOne({ userId });
    if (!profile) {
      profile = await LinkedInProfile.create({
        userId,
        experience: [],
        education: [],
        skills: [],
        profileScore: 0,
      });
    }
    return profile;
  }

  async update(
    userId: string,
    data: Partial<ILinkedInProfileDocument>
  ): Promise<ILinkedInProfileDocument> {
    const profile = await this.getOrCreate(userId);

    if (data.linkedinUrl !== undefined) profile.linkedinUrl = sanitizeText(data.linkedinUrl, 300);
    if (data.headline !== undefined) profile.headline = sanitizeText(data.headline, 220);
    if (data.about !== undefined) profile.about = sanitizeText(data.about, 3000);
    if (data.experience !== undefined) profile.experience = data.experience.slice(0, 20);
    if (data.education !== undefined) profile.education = data.education.slice(0, 20);
    if (data.skills !== undefined) profile.skills = sanitizeStringArray(data.skills);
    if (data.connections !== undefined) profile.connections = data.connections;
    if (data.followers !== undefined) profile.followers = data.followers;

    profile.profileScore = calculateLinkedInScore(profile);
    profile.lastSyncedAt = new Date();
    await profile.save();

    await activityService.log(userId, "LINKEDIN_UPDATED", "LinkedIn profile updated manually");
    return profile;
  }

  serialize(doc: ILinkedInProfileDocument): ILinkedInProfile {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      linkedinUrl: doc.linkedinUrl,
      headline: doc.headline,
      about: doc.about,
      experience: doc.experience ?? [],
      education: doc.education ?? [],
      skills: doc.skills ?? [],
      connections: doc.connections,
      followers: doc.followers,
      profileScore: doc.profileScore,
      lastSyncedAt: doc.lastSyncedAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}

export const linkedInProfileService = new LinkedInProfileService();
