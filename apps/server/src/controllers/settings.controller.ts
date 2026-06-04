import { Request, Response, NextFunction } from "express";
import { settingsService } from "../services/settings.service";
import { sendSuccess } from "../utils/apiResponse.util";

class SettingsController {
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await settingsService.getOrCreate(req.userId!);
      sendSuccess(res, "Settings retrieved", { settings: settingsService.serialize(settings) });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await settingsService.update(req.userId!, req.body);
      sendSuccess(res, "Settings updated", { settings: settingsService.serialize(settings) });
    } catch (error) {
      next(error);
    }
  };
}

export const settingsController = new SettingsController();
