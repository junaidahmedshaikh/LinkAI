import { Permission } from "../models/Permission.model";
import { User } from "../models/User.model";
import { cacheService, cacheKeys } from "./cache.service";
import type { IUserPermission } from "@linkai/types";

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["PROFILE", "RESUME", "ACTIVITY", "EXTENSION"],
  pro: ["PROFILE", "RESUME", "ACTIVITY", "EXTENSION", "LINKEDIN_SYNC"],
  premium: ["PROFILE", "RESUME", "ACTIVITY", "EXTENSION", "LINKEDIN_SYNC", "ANALYTICS"],
};

class PermissionService {
  private serialize(doc: {
    _id: unknown;
    userId: unknown;
    permissions: string[];
    featureAccess: string[];
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): IUserPermission {
    return {
      _id: String(doc._id),
      userId: String(doc.userId),
      permissions: doc.permissions,
      featureAccess: doc.featureAccess,
      role: doc.role,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async getOrCreate(userId: string): Promise<IUserPermission> {
    const cached = cacheService.get<IUserPermission>(cacheKeys.permissions(userId));
    if (cached) return cached;

    let perm = await Permission.findOne({ userId });
    if (!perm) {
      const user = await User.findById(userId);
      const plan = user?.subscriptionPlan ?? "free";
      try {
        perm = await Permission.create({
          userId,
          permissions: ["read:profile", "write:profile", "read:settings", "write:settings"],
          featureAccess: PLAN_FEATURES[plan] ?? PLAN_FEATURES.free,
          role: user?.role ?? "user",
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        perm = await Permission.findOne({ userId });
        if (!perm) throw error;
      }
    }

    const serialized = this.serialize({
      ...perm.toObject(),
      createdAt: perm.createdAt,
      updatedAt: perm.updatedAt,
    });
    cacheService.set(cacheKeys.permissions(userId), serialized);
    return serialized;
  }

  invalidate(userId: string): void {
    cacheService.delete(cacheKeys.permissions(userId));
  }
}

export const permissionService = new PermissionService();
