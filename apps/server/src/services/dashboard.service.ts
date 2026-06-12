import { settingsService } from "./settings.service";
import { userContextService } from "./sync.service";
import type { IDashboardOverview } from "@linkai/types";

class DashboardService {
  async getOverview(userId: string): Promise<IDashboardOverview> {
    const [settings, extensionStatus] = await Promise.all([
      settingsService.getOrCreate(userId),
      userContextService.getExtensionStatus(userId),
    ]);

    return {
      usageStats: { ...settings.usageStats },
      extensionStatus,
    };
  }
}

export const dashboardService = new DashboardService();
