import { User } from "../models/User.model";
import { activityService } from "./activity.service";
import { authService } from "./auth.service";
import { sessionService } from "./session.service";
import { auditService } from "./audit.service";
import { userContextService } from "./sync.service";
import type { DeviceType, ISessionDevice } from "@linkai/types";

class SecurityService {
  buildWebSessionContext(req: { ip?: string; headers: Record<string, unknown> }, deviceId?: string) {
    return {
      deviceId: deviceId ?? sessionService.generateDeviceId(),
      deviceType: "WEB" as DeviceType,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] as string | undefined,
    };
  }

  async recordLogin(
    userId: string,
    ip?: string,
    userAgent?: string,
    deviceId?: string
  ): Promise<void> {
    await sessionService.upsertSession({
      userId,
      deviceId: deviceId ?? sessionService.generateDeviceId(),
      deviceType: "WEB",
      ipAddress: ip,
      userAgent,
    });
    await activityService.log(userId, "LOGIN", "User signed in", { ip, deviceType: "WEB" });
    await auditService.log(userId, "LOGIN", { ipAddress: ip, userAgent });
  }

  async recordLogout(userId: string, ip?: string, userAgent?: string): Promise<void> {
    userContextService.invalidateUser(userId);
    await activityService.log(userId, "LOGOUT", "User signed out");
    await auditService.log(userId, "LOGOUT", { ipAddress: ip, userAgent });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select("+password");
    if (!user || user.provider !== "local") {
      throw new Error("Password change not available for OAuth accounts");
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new Error("Current password is incorrect");

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    await sessionService.revokeAllSessions(userId);
    userContextService.invalidateUser(userId);
    await activityService.log(userId, "PASSWORD_CHANGED", "Password changed successfully");
    await auditService.log(userId, "PASSWORD_CHANGE");
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await authService.logoutAll(userId);
    userContextService.invalidateUser(userId);
    await activityService.log(userId, "LOGOUT", "Logged out from all devices");
    await auditService.log(userId, "LOGOUT", { metadata: { scope: "all_devices" } });
  }

  async getSessions(userId: string, limit = 50): Promise<ISessionDevice[]> {
    return sessionService.getActiveSessions(userId, limit);
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const revoked = await sessionService.revokeSession(sessionId, userId);
    if (revoked) {
      userContextService.invalidateUser(userId);
      await activityService.log(userId, "SESSION_REVOKED", "Session terminated");
      await auditService.log(userId, "SESSION_REVOKED", { resource: sessionId });
    }
    return revoked;
  }
}

export const securityService = new SecurityService();
