import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { authService } from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/apiResponse.util";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie.util";
import { env } from "../config/env";
import { IUserDocument } from "../models/User.model";
import { securityService } from "../services/security.service";

class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fullName, email, password } = req.body;
      const sessionContext = securityService.buildWebSessionContext(req, req.body.deviceId);
      const { user, accessToken, refreshToken, sessionId } = await authService.register(
        {
          fullName,
          email,
          password,
        },
        sessionContext
      );

      setAuthCookies(res, accessToken, refreshToken);

      await securityService.recordLogin(
        user._id.toString(),
        req.ip,
        req.headers["user-agent"] as string | undefined,
        sessionContext.deviceId,
        sessionId
      );

      sendSuccess(
        res,
        "Account created successfully",
        {
          accessToken,
          refreshToken,
          sessionId,
          user: authService.sanitizeUser(user),
        },
        201
      );
    } catch (error) {
      if ((error as Error).message === "User already exists") {
        sendError(res, (error as Error).message, 409);
        return;
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const sessionContext = securityService.buildWebSessionContext(req, req.body.deviceId);
      const { user, accessToken, refreshToken, sessionId } = await authService.login(
        email,
        password,
        sessionContext
      );

      setAuthCookies(res, accessToken, refreshToken);

      await securityService.recordLogin(
        user._id.toString(),
        req.ip,
        req.headers["user-agent"] as string | undefined,
        sessionContext.deviceId,
        sessionId
      );

      sendSuccess(res, "Logged in successfully", {
        accessToken,
        refreshToken,
        sessionId,
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      if (env.NODE_ENV === "development") {
        console.error("[auth.login]", error);
      }
      const message = error instanceof Error ? error.message : "Invalid email or password";
      if (message === "Invalid email or password") {
        sendError(res, message, 401);
        return;
      }
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.userId) {
        await authService.logout(req.userId, req.sessionId);
        await securityService.recordLogout(
          req.userId,
          req.ip,
          req.headers["user-agent"] as string | undefined
        );
      }
      clearAuthCookies(res);
      sendSuccess(res, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken =
        (req.cookies?.refreshToken as string) || (req.body.refreshToken as string);

      if (!refreshToken) {
        sendError(res, "Refresh token required", 401);
        return;
      }

      const { accessToken, refreshToken: newRefresh, user } =
        await authService.refreshTokens(refreshToken);

      setAuthCookies(res, accessToken, newRefresh);

      sendSuccess(res, "Token refreshed", {
        accessToken,
        refreshToken: newRefresh,
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      clearAuthCookies(res);
      if (env.NODE_ENV === "development") {
        console.error("[auth.refresh]", error);
      }
      const message = error instanceof Error ? error.message : "Invalid refresh token";
      if (message === "Session revoked") {
        sendError(res, "Session expired or revoked", 401);
        return;
      }
      sendError(res, "Invalid or expired refresh token", 401);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      const responseData =
        env.NODE_ENV === "development" && result
          ? { resetToken: result.resetToken }
          : undefined;

      sendSuccess(
        res,
        "If an account exists with this email, a reset link has been sent",
        responseData
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      const user = await authService.resetPassword(token, password);
      sendSuccess(res, "Password reset successfully", {
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      sendError(res, (error as Error).message, 400);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as IUserDocument;
      sendSuccess(res, "User retrieved", {
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fullName, avatar } = req.body;
      const user = await authService.updateProfile(req.userId!, { fullName, avatar });
      sendSuccess(res, "Profile updated successfully", {
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Account not found") {
        sendError(res, message, 404);
        return;
      }
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        sendError(res, "Verification token required", 400);
        return;
      }
      const user = await authService.verifyEmail(token);
      sendSuccess(res, "Email verified successfully", {
        user: authService.sanitizeUser(user),
      });
    } catch (error) {
      sendError(res, (error as Error).message, 400);
    }
  };

  googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  });

  googleCallback = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    passport.authenticate("google", { session: false }, async (err: Error | null, user: Express.User | false) => {
      if (err || !user) {
        res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
        return;
      }
      try {
        const sessionContext = securityService.buildWebSessionContext(req);
        const { accessToken, refreshToken, sessionId } = await authService.generateAuthTokens(
          user,
          sessionContext
        );
        setAuthCookies(res, accessToken, refreshToken);
        await securityService.recordLogin(
          user._id.toString(),
          req.ip,
          req.headers["user-agent"] as string | undefined,
          sessionContext.deviceId,
          sessionId
        );
        res.redirect(`${env.CLIENT_URL}/dashboard`);
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  };

  linkedinAuth = passport.authenticate("linkedin", {
    session: false,
  });

  linkedinCallback = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    passport.authenticate("linkedin", { session: false }, async (err: Error | null, user: Express.User | false) => {
      if (err || !user) {
        res.redirect(`${env.CLIENT_URL}/login?error=linkedin_auth_failed`);
        return;
      }
      try {
        const sessionContext = securityService.buildWebSessionContext(req);
        const { accessToken, refreshToken, sessionId } = await authService.generateAuthTokens(
          user,
          sessionContext
        );
        setAuthCookies(res, accessToken, refreshToken);
        await securityService.recordLogin(
          user._id.toString(),
          req.ip,
          req.headers["user-agent"] as string | undefined,
          sessionContext.deviceId,
          sessionId
        );
        res.redirect(`${env.CLIENT_URL}/dashboard`);
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  };
}

export const authController = new AuthController();
