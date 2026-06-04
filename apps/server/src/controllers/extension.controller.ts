import { Request, Response, NextFunction } from "express";
import { extensionService } from "../services/extension.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class ExtensionController {
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await extensionService.getMe(req.userId!);
      sendSuccess(res, "Extension user retrieved", data);
    } catch (error) {
      next(error);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await extensionService.getSettings(req.userId!);
      sendSuccess(res, "Extension settings retrieved", { settings });
    } catch (error) {
      next(error);
    }
  };

  logActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, action, metadata } = req.body;
      const activity = await extensionService.logActivity(req.userId!, type, action, metadata);
      sendSuccess(res, "Activity logged", { activityId: activity._id.toString() }, 201);
    } catch (error) {
      next(error);
    }
  };

  heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await extensionService.heartbeat(req.userId!, req.body);
      sendSuccess(res, "Heartbeat received", result);
    } catch (error) {
      sendError(res, (error as Error).message, 400);
    }
  };
}

export const extensionController = new ExtensionController();
