import { API_ROUTES } from "@linkai/shared";
import type { ApiResponse, AuthTokensResponse, IUser } from "@linkai/types";
import { apiClient } from "./api.client";
import { tokenService } from "./token.service";
import { storageService, StorageKeys } from "./storage.service";
import { extensionSessionService } from "./session.service";

class AuthService {
  private async authPayload(email: string, password: string) {
    const deviceId = await extensionSessionService.getDeviceId();
    return { email, password, deviceId };
  }

  async login(email: string, password: string): Promise<IUser> {
    const { data } = await apiClient.post<ApiResponse<AuthTokensResponse & { refreshToken?: string }>>(
      API_ROUTES.AUTH.LOGIN,
      await this.authPayload(email, password)
    );
    const payload = data.data!;
    await tokenService.setTokens(payload.accessToken, payload.refreshToken);
    await storageService.set(StorageKeys.USER_CACHE, payload.user);
    return payload.user;
  }

  async register(fullName: string, email: string, password: string): Promise<IUser> {
    const deviceId = await extensionSessionService.getDeviceId();
    const { data } = await apiClient.post<ApiResponse<AuthTokensResponse & { refreshToken?: string }>>(
      API_ROUTES.AUTH.REGISTER,
      { fullName, email, password, deviceId }
    );
    const payload = data.data!;
    await tokenService.setTokens(payload.accessToken, payload.refreshToken);
    await storageService.set(StorageKeys.USER_CACHE, payload.user);
    return payload.user;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ROUTES.AUTH.LOGOUT);
    } finally {
      await tokenService.clearTokens();
    }
  }

  async refreshSession(): Promise<IUser | null> {
    const refreshToken = await storageService.getRefreshToken();
    if (!refreshToken) return null;

    const { data } = await apiClient.post<ApiResponse<AuthTokensResponse & { refreshToken?: string }>>(
      API_ROUTES.AUTH.REFRESH,
      { refreshToken }
    );
    const payload = data.data!;
    await tokenService.setTokens(payload.accessToken, payload.refreshToken ?? refreshToken);
    await storageService.set(StorageKeys.USER_CACHE, payload.user);
    return payload.user;
  }

  async getCachedUser(): Promise<IUser | null> {
    return storageService.get<IUser>(StorageKeys.USER_CACHE);
  }

  async isAuthenticated(): Promise<boolean> {
    return tokenService.hasValidSession();
  }
}

export const authService = new AuthService();
