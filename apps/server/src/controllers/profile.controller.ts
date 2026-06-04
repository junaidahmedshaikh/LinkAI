import { Request, Response, NextFunction } from "express";
import { profileService } from "../services/profile.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class ProfileController {
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await profileService.getOrCreate(req.userId!);
      sendSuccess(res, "Profile retrieved", { profile: profileService.serialize(profile) });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await profileService.update(req.userId!, req.body);
      sendSuccess(res, "Profile updated", { profile: profileService.serialize(profile) });
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        sendError(res, "No file uploaded", 400);
        return;
      }
      const profile = await profileService.uploadAvatar(req.userId!, req.file);
      sendSuccess(res, "Avatar uploaded", { profile: profileService.serialize(profile) });
    } catch (error) {
      next(error);
    }
  };

  deleteAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await profileService.deleteAvatar(req.userId!);
      sendSuccess(res, "Avatar deleted", { profile: profileService.serialize(profile) });
    } catch (error) {
      next(error);
    }
  };

  getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await profileService.getPublicProfile(String(req.params.userId));
      if (!profile) {
        sendError(res, "Profile not found", 404);
        return;
      }
      sendSuccess(res, "Public profile retrieved", { profile });
    } catch (error) {
      next(error);
    }
  };
}

export const profileController = new ProfileController();
