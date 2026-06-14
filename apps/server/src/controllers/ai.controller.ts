import { Request, Response, NextFunction } from "express";
import { commentService } from "../services/comment.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";
import type { IGenerateCommentRequest } from "@linkai/types";

function firstQueryValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

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
      const limit = Math.min(Number(firstQueryValue(req.query.limit)) || 20, 100);
      const offset = Math.max(Number(firstQueryValue(req.query.offset)) || 0, 0);

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
      const id = String(req.params.id);
      await commentService.deleteComment(req.userId!, id);
      sendSuccess(res, "Comment deleted successfully", {});
    } catch (error) {
      const message = (error as Error).message || "Failed to delete comment";
      sendError(res, message, error instanceof Error && message.includes("not found") ? 404 : 400);
    }
  };

  searchComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryStr = firstQueryValue(req.query.q);
      if (!queryStr) {
        sendError(res, "Query parameter 'q' is required", 400);
        return;
      }

      const limit = Math.min(Number(firstQueryValue(req.query.limit)) || 20, 100);
      const results = await commentService.searchHistory(req.userId!, queryStr, limit);

      sendSuccess(res, "Search completed", { results, count: results.length });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
