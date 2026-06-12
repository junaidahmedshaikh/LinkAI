import { Request, Response, NextFunction } from "express";
import { syncService, userContextService } from "../services/sync.service";
import { analyticsService } from "../services/analytics.service";
import { auditService } from "../services/audit.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class SyncController {
  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await syncService.getUser(req.userId!);
      sendSuccess(res, "Sync user retrieved", data);
    } catch (error) {
      next(error);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await syncService.getSettings(req.userId!);
      sendSuccess(res, "Sync settings retrieved", { settings });
    } catch (error) {
      next(error);
    }
  };

  getUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usage = await syncService.getUsage(req.userId!);
      sendSuccess(res, "Sync usage retrieved", { usage });
    } catch (error) {
      next(error);
    }
  };

  getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await syncService.getPermissions(req.userId!);
      sendSuccess(res, "Permissions retrieved", { permissions });
    } catch (error) {
      next(error);
    }
  };

  getFeatureFlags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const featureFlags = await syncService.getFeatureFlags();
      sendSuccess(res, "Feature flags retrieved", { featureFlags });
    } catch (error) {
      next(error);
    }
  };

  heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await syncService.heartbeat(req.userId!, req.body);
      sendSuccess(res, "Heartbeat received", result);
    } catch (error) {
      sendError(res, (error as Error).message, 400);
    }
  };
}

class ExtensionConnectController {
  connect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken as string | undefined;
      const data = await syncService.connectExtension(req.userId!, req.body, {
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string | undefined,
        refreshToken,
      });

      await auditService.log(req.userId!, "EXTENSION_CONNECTED", {
        metadata: { deviceId: req.body.deviceId },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string | undefined,
      });
      await analyticsService.track(req.userId!, "EXTENSION", "EXTENSION_OPEN", {
        deviceId: req.body.deviceId,
      });

      sendSuccess(res, "Extension connected", data);
    } catch (error) {
      next(error);
    }
  };

  disconnect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await syncService.disconnectExtension(req.userId!, req.body.deviceId);
      userContextService.invalidateUser(req.userId!);
      await auditService.log(req.userId!, "EXTENSION_DISCONNECTED", {
        metadata: { deviceId: req.body.deviceId },
      });
      sendSuccess(res, "Extension disconnected");
    } catch (error) {
      next(error);
    }
  };
}

export const syncController = new SyncController();
export const extensionConnectController = new ExtensionConnectController();
