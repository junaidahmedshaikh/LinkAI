import { Request, Response, NextFunction } from "express";
import { commentService } from "../services/comment.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";
import type { IGenerateCommentRequest } from "@linkai/types";

class AiController {
  generateComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IGenerateCommentRequest;
      const result = await commentService.generate(req.userId!, payload);
      sendSuccess(res, "Comment generated successfully", result, 200);
    } catch (error) {
      const message = (error as Error).message || "Failed to generate comment";
      sendError(res, message, 400);
    }
  };

  getCommentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(Number(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit) || 20, 100);
      const offset = Math.max(Number(Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset) || 0, 0);

      const { items, total } = await commentService.getHistory(req.userId!, limit, offset);

      sendSuccess(res, "Comment history retrieved", {
        history: items,
        total,
        limit,
        offset,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await commentService.deleteComment(req.userId!, id);
      sendSuccess(res, "Comment deleted successfully", {});
    } catch (error) {
      const message = (error as Error).message || "Failed to delete comment";
      sendError(res, message, error instanceof Error && message.includes("not found") ? 404 : 400);
    }
  };

  searchComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      if (!q || (Array.isArray(q) ? q[0] : q) === "") {
        sendError(res, "Query parameter 'q' is required", 400);
        return;
      }

      const queryStr = Array.isArray(q) ? q[0] : q;
      const limit = Math.min(Number(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit) || 20, 100);
      const results = await commentService.searchHistory(req.userId!, queryStr, limit);

      sendSuccess(res, "Search completed", { results, count: results.length });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
