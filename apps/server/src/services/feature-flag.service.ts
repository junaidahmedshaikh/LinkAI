import { FeatureFlag } from "../models/FeatureFlag.model";
import { DEFAULT_FEATURE_FLAGS } from "@linkai/shared";
import { cacheService, cacheKeys } from "./cache.service";
import type { IFeatureFlag } from "@linkai/types";

class FeatureFlagService {
  private serialize(doc: {
    _id: unknown;
    name: string;
    key: string;
    enabled: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  }): IFeatureFlag {
    return {
      _id: String(doc._id),
      name: doc.name,
      key: doc.key,
      enabled: doc.enabled,
      description: doc.description,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async ensureDefaults(): Promise<void> {
    for (const flag of DEFAULT_FEATURE_FLAGS) {
      await FeatureFlag.findOneAndUpdate(
        { key: flag.key },
        { $setOnInsert: { ...flag } },
        { upsert: true }
      );
    }
  }

  async getAll(): Promise<IFeatureFlag[]> {
    const cached = cacheService.get<IFeatureFlag[]>(cacheKeys.featureFlags());
    if (cached) return cached;

    await this.ensureDefaults();
    const flags = await FeatureFlag.find().sort({ key: 1 }).lean();
    const serialized = flags.map((f) =>
      this.serialize({
        ...f,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })
    );
    cacheService.set(cacheKeys.featureFlags(), serialized, 10 * 60 * 1000);
    return serialized;
  }

  async isEnabled(key: string): Promise<boolean> {
    const flags = await this.getAll();
    return flags.find((f) => f.key === key)?.enabled ?? false;
  }
}

export const featureFlagService = new FeatureFlagService();
