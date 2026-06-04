import { Request, Response, NextFunction } from "express";
import { activityService } from "../services/activity.service";
import { sendSuccess } from "../utils/apiResponse.util";

class ActivityController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.body.page ?? req.query.page) || 1;
      const limit = Number(req.body.limit ?? req.query.limit) || 20;
      const result = await activityService.getPaginated(req.userId!, page, limit);
      sendSuccess(res, "Activities retrieved", result);
    } catch (error) {
      next(error);
    }
  };
}

export const activityController = new ActivityController();
