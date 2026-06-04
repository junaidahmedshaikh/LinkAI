import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { authService } from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class UserController {
  completeOnboarding = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId) {
        sendError(res, "Authentication required", 401);
        return;
      }

      const user = await userService.completeOnboarding(req.userId, req.body);
      sendSuccess(res, "Onboarding completed", {
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
