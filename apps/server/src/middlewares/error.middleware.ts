import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse.util";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);

  if (err.name === "MongoServerError" && (err as { code?: number }).code === 11000) {
    sendError(res, "User already exists", 409);
    return;
  }

  const message = isProduction ? "Internal server error" : err.message;
  sendError(res, message, 500);
}
