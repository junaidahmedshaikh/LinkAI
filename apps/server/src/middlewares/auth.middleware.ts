import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { sendError } from "../utils/apiResponse.util";
import { User } from "../models/User.model";
import { sessionService } from "../services/session.service";
import type { UserRole } from "@linkai/types";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken as string | undefined;
    const token =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

    if (!token) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const payload = verifyAccessToken(token);

    if (payload.sessionId) {
      const active = await sessionService.validateSession(payload.sessionId);
      if (!active) {
        sendError(res, "Session expired or revoked", 401);
        return;
      }
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      sendError(res, "Account not found", 401);
      return;
    }

    req.userId = payload.userId;
    req.userRole = payload.role;
    req.sessionId = payload.sessionId;
    req.deviceId = payload.deviceId;
    req.user = user;
    next();
  } catch {
    sendError(res, "Session expired", 401);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole as UserRole)) {
      sendError(res, "Insufficient permissions", 403);
      return;
    }
    next();
  };
}
