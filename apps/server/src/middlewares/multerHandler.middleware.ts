import { Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";
import { sendError } from "../utils/apiResponse.util";

export function handleMulter(middleware: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          sendError(res, "File too large", 400);
          return;
        }
        sendError(res, err.message, 400);
        return;
      }
      if (err) {
        sendError(res, (err as Error).message, 400);
        return;
      }
      next();
    });
  };
}
