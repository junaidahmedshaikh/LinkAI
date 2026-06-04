import { API_ROUTES } from "@linkai/shared";
import type { ApiResponse, AuthTokensResponse, IUser } from "@linkai/types";
import { apiClient } from "./api.client";
import { tokenService } from "./token.service";
import { storageService, StorageKeys } from "./storage.service";

class AuthService {
  async login(email: string, password: string): Promise<IUser> {
    const { data } = await apiClient.post<ApiResponse<AuthTokensResponse & { refreshToken?: string }>>(
      API_ROUTES.AUTH.LOGIN,
      { email, password }
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
