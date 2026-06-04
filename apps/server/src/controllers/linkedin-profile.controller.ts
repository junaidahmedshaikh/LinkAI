import { Request, Response, NextFunction } from "express";
import { linkedInProfileService } from "../services/linkedin-profile.service";
import { sendSuccess } from "../utils/apiResponse.util";

class LinkedInProfileController {
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await linkedInProfileService.getOrCreate(req.userId!);
      sendSuccess(res, "LinkedIn profile retrieved", {
        linkedInProfile: linkedInProfileService.serialize(profile),
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await linkedInProfileService.update(req.userId!, req.body);
      sendSuccess(res, "LinkedIn profile updated", {
        linkedInProfile: linkedInProfileService.serialize(profile),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const linkedInProfileController = new LinkedInProfileController();
