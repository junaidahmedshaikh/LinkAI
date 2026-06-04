import { Settings, ISettingsDocument } from "../models/Settings.model";
import { activityService } from "./activity.service";
import type { IUserSettings } from "@linkai/types";

class SettingsService {
  async getOrCreate(userId: string): Promise<ISettingsDocument> {
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return settings;
  }

  async update(
    userId: string,
    data: {
      notifications?: Partial<ISettingsDocument["notifications"]>;
      preferences?: Partial<ISettingsDocument["preferences"]>;
    }
  ): Promise<ISettingsDocument> {
    const settings = await this.getOrCreate(userId);

    if (data.notifications) {
      Object.assign(settings.notifications, data.notifications);
    }
    if (data.preferences) {
      Object.assign(settings.preferences, data.preferences);
    }

    await settings.save();
    await activityService.log(userId, "SETTINGS_UPDATED", "User settings updated");
    return settings;
  }

  serialize(doc: ISettingsDocument): IUserSettings {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      notifications: { ...doc.notifications },
      preferences: { ...doc.preferences },
      usageStats: { ...doc.usageStats },
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}

export const settingsService = new SettingsService();
