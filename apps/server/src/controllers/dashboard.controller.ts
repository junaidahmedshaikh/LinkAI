import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/apiResponse.util";

class DashboardController {
  overview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await dashboardService.getOverview(req.userId!);
      sendSuccess(res, "Dashboard overview retrieved", { overview });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
