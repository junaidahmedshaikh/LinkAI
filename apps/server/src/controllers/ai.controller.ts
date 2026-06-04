import { Request, Response, NextFunction } from "express";
import { commentService } from "../services/comment.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";

class AiController {
  generateComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await commentService.generate(req.userId!, req.body);
      sendSuccess(res, "Comment generated", result);
    } catch (error) {
      sendError(res, (error as Error).message, 400);
    }
  };

  getCommentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const history = await commentService.getHistory(req.userId!, limit);
      sendSuccess(res, "Comment history retrieved", { history });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
