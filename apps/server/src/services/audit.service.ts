import { Audit } from "../models/Audit.model";
import type { AuditAction, IAuditLog } from "@linkai/types";

class AuditService {
  async log(
    userId: string,
    action: AuditAction,
    options?: {
      resource?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await Audit.create({
      userId,
      action,
      resource: options?.resource,
      metadata: options?.metadata,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
  }

  async getRecent(userId: string, limit = 50): Promise<IAuditLog[]> {
    const logs = await Audit.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    return logs.map((l) => ({
      _id: String(l._id),
      userId: String(l.userId),
      action: l.action,
      resource: l.resource,
      metadata: l.metadata as Record<string, unknown> | undefined,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}

export const auditService = new AuditService();
