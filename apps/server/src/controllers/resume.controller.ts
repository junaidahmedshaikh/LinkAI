import { Request, Response, NextFunction } from "express";
import { resumeService } from "../services/resume.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class ResumeController {
  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        sendError(res, "No resume file uploaded", 400);
        return;
      }
      const resume = await resumeService.upload(req.userId!, req.file);
      sendSuccess(res, "Resume uploaded", { resume: resumeService.serialize(resume) }, 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resumes = await resumeService.list(req.userId!);
      sendSuccess(res, "Resumes retrieved", {
        resumes: resumes.map((r) => resumeService.serialize(r)),
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await resumeService.delete(req.userId!, String(req.params.id));
      sendSuccess(res, "Resume deleted");
    } catch (error) {
      sendError(res, (error as Error).message, 404);
    }
  };

  setPrimary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resume = await resumeService.setPrimary(req.userId!, String(req.params.id));
      sendSuccess(res, "Primary resume updated", { resume: resumeService.serialize(resume) });
    } catch (error) {
      sendError(res, (error as Error).message, 404);
    }
  };
}

export const resumeController = new ResumeController();
