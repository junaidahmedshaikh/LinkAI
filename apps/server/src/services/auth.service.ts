import { User, IUserDocument } from "../models/User.model";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
  generateResetToken,
  generateEmailVerificationToken,
  TokenPayload,
} from "../utils/jwt.util";
import { sessionService } from "./session.service";
import type { AuthProvider, DeviceType } from "@linkai/types";

interface OAuthUserInput {
  provider: AuthProvider;
  providerId: string;
  email: string;
  fullName: string;
  avatar?: string;
}

export interface AuthSessionContext {
  deviceId: string;
  deviceType: DeviceType;
  browser?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuthService {
  private buildTokenPayload(user: IUserDocument, session?: { sessionId: string; deviceId: string; deviceType: DeviceType }): TokenPayload {
    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: session?.sessionId,
      deviceId: session?.deviceId,
      deviceType: session?.deviceType,
    };
  }

  async generateAuthTokens(
    user: IUserDocument,
    sessionContext?: AuthSessionContext
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId?: string;
  }> {
    let sessionId: string | undefined;
    let deviceId = sessionContext?.deviceId;
    let deviceType = sessionContext?.deviceType;

    const refreshToken = generateRefreshToken(
      this.buildTokenPayload(user, deviceId && deviceType ? { sessionId: "", deviceId, deviceType } : undefined)
    );

    if (sessionContext) {
      const session = await sessionService.upsertSession({
        userId: user._id.toString(),
        deviceId: sessionContext.deviceId,
        deviceType: sessionContext.deviceType,
        browser: sessionContext.browser,
        ipAddress: sessionContext.ipAddress,
        userAgent: sessionContext.userAgent,
        refreshToken,
      });
      sessionId = session._id;

      const payload = this.buildTokenPayload(user, {
        sessionId,
        deviceId: sessionContext.deviceId,
        deviceType: sessionContext.deviceType,
      });
      const accessToken = generateAccessToken(payload);
      const finalRefresh = generateRefreshToken(payload);
      await sessionService.updateRefreshHash(sessionId, finalRefresh);
      user.refreshToken = hashToken(finalRefresh);
      await user.save({ validateBeforeSave: false });
      return { accessToken, refreshToken: finalRefresh, sessionId };
    }

    const payload = this.buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  }

  async register(data: {
    fullName: string;
    email: string;
    password: string;
  }, sessionContext?: AuthSessionContext): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string; sessionId?: string }> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error("User already exists");
    }

    const verificationToken = generateEmailVerificationToken();

    const user = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      password: data.password,
      provider: "local",
      emailVerificationToken: verificationToken,
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateAuthTokens(user, sessionContext);
    return { user, ...tokens };
  }

  async login(
    email: string,
    password: string,
    sessionContext?: AuthSessionContext
  ): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string; sessionId?: string }> {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken");

    if (!user || user.provider !== "local") {
      throw new Error("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const tokens = await this.generateAuthTokens(user, sessionContext);
    return { user, ...tokens };
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await sessionService.revokeSession(sessionId, userId);
    }
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  async logoutAll(userId: string): Promise<void> {
    await sessionService.revokeAllSessions(userId);
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  async refreshTokens(
    incomingRefreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; user: IUserDocument; sessionId?: string }> {
    const payload = verifyRefreshToken(incomingRefreshToken);
    const hashed = hashToken(incomingRefreshToken);

    const user = await User.findById(payload.userId).select("+refreshToken");
    if (!user) throw new Error("Invalid refresh token");

    if (payload.sessionId) {
      const sessionValid = await sessionService.validateSession(payload.sessionId);
      if (!sessionValid) throw new Error("Session revoked");

      const tokenMatch = await sessionService.verifyRefreshForSession(payload.sessionId, incomingRefreshToken);
      if (!tokenMatch && user.refreshToken !== hashed) {
        throw new Error("Invalid refresh token");
      }
    } else if (user.refreshToken !== hashed) {
      throw new Error("Invalid refresh token");
    }

    const sessionContext =
      payload.sessionId && payload.deviceId && payload.deviceType
        ? {
            deviceId: payload.deviceId,
            deviceType: payload.deviceType as DeviceType,
          }
        : undefined;

    if (sessionContext && payload.sessionId) {
      const tokenPayload = this.buildTokenPayload(user, {
        sessionId: payload.sessionId,
        deviceId: payload.deviceId!,
        deviceType: payload.deviceType as DeviceType,
      });
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      await sessionService.updateRefreshHash(payload.sessionId, refreshToken);
      user.refreshToken = hashToken(refreshToken);
      await user.save({ validateBeforeSave: false });
      await sessionService.touchSession(payload.sessionId);
      return { accessToken, refreshToken, user, sessionId: payload.sessionId };
    }

    const tokens = await this.generateAuthTokens(user);
    return { ...tokens, user };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string } | null> {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordResetToken +passwordResetExpires"
    );

    if (!user) return null;

    const { token, hashedToken } = generateResetToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    return { resetToken: token };
  }

  async resetPassword(token: string, newPassword: string): Promise<IUserDocument> {
    const hashed = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return user;
  }

  async verifyEmail(token: string): Promise<IUserDocument> {
    const user = await User.findOne({ emailVerificationToken: token }).select(
      "+emailVerificationToken"
    );

    if (!user) {
      throw new Error("Invalid verification token");
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    return user;
  }

  async findOrCreateOAuthUser(input: OAuthUserInput): Promise<IUserDocument> {
    let user = await User.findOne({
      $or: [
        { provider: input.provider, providerId: input.providerId },
        { email: input.email.toLowerCase() },
      ],
    });

    if (user) {
      if (!user.providerId) {
        user.provider = input.provider;
        user.providerId = input.providerId;
        user.emailVerified = true;
        if (input.avatar) user.avatar = input.avatar;
        await user.save({ validateBeforeSave: false });
      }
      return user;
    }

    user = await User.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      provider: input.provider,
      providerId: input.providerId,
      avatar: input.avatar ?? "",
      emailVerified: true,
    });

    return user;
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; avatar?: string }
  ): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Account not found");
    }

    if (data.fullName !== undefined) {
      user.fullName = data.fullName.trim();
    }
    if (data.avatar !== undefined) {
      user.avatar = data.avatar;
    }

    await user.save();
    return user;
  }

  sanitizeUser(user: IUserDocument) {
    const obj = user.toJSON();
    return {
      _id: obj._id,
      fullName: obj.fullName,
      email: obj.email,
      avatar: obj.avatar,
      provider: obj.provider,
      subscriptionPlan: obj.subscriptionPlan,
      role: obj.role,
      emailVerified: obj.emailVerified,
      profile: obj.profile,
      lastLoginAt: obj.lastLoginAt,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}

export const authService = new AuthService();
