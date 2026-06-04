import { Profile } from "../models/Profile.model";
import { Resume } from "../models/Resume.model";
import { LinkedInProfile } from "../models/LinkedInProfile.model";
import { settingsService } from "./settings.service";
import { activityService } from "./activity.service";
import { userContextService } from "./sync.service";
import type { IDashboardOverview } from "@linkai/types";

class DashboardService {
  async getOverview(userId: string): Promise<IDashboardOverview> {
    const [profile, resumeCount, linkedin, settings, recentActivities, extensionStatus] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      Resume.countDocuments({ userId }),
      LinkedInProfile.findOne({ userId }).lean(),
      settingsService.getOrCreate(userId),
      activityService.getRecent(userId, 8),
      userContextService.getExtensionStatus(userId),
    ]);

    const linkedinConnected = !!(linkedin?.linkedinUrl && linkedin.linkedinUrl.length > 0);

    return {
      profileCompletion: profile?.profileScore ?? 0,
      resumeUploaded: resumeCount > 0,
      resumeCount,
      linkedinConnected,
      linkedinProfileScore: linkedin?.profileScore ?? 0,
      usageStats: { ...settings.usageStats },
      recentActivities,
      extensionStatus,
    };
  }
}

export const dashboardService = new DashboardService();
