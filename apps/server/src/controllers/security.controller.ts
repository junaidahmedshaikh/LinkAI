import { Request, Response, NextFunction } from "express";
import { securityService } from "../services/security.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class SecurityController {
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      await securityService.changePassword(req.userId!, currentPassword, newPassword);
      sendSuccess(res, "Password changed successfully");
    } catch (error) {
      sendError(res, (error as Error).message, 400);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await securityService.logoutAllDevices(req.userId!);
      sendSuccess(res, "Logged out from all devices");
    } catch (error) {
      next(error);
    }
  };

  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await securityService.getSessions(req.userId!);
      sendSuccess(res, "Sessions retrieved", { sessions });
    } catch (error) {
      next(error);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = String(req.params.sessionId);
      const revoked = await securityService.revokeSession(req.userId!, sessionId);
      if (!revoked) {
        sendError(res, "Session not found", 404);
        return;
      }
      sendSuccess(res, "Session revoked");
    } catch (error) {
      next(error);
    }
  };
}

export const securityController = new SecurityController();
