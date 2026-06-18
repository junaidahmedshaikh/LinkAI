import { storageService } from "./storage.service";
import { isAccessTokenValid, isRefreshTokenPresent } from "@/utils/jwt.util";

class TokenService {
  private memoryAccess: string | null = null;

  async getAccessToken(): Promise<string | null> {
    if (this.memoryAccess && isAccessTokenValid(this.memoryAccess)) {
      return this.memoryAccess;
    }
    const stored = await storageService.getAccessToken();
    if (stored && isAccessTokenValid(stored)) {
      this.memoryAccess = stored;
      return stored;
    }
    this.memoryAccess = null;
    return null;
  }

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    this.memoryAccess = accessToken;
    await storageService.setAccessToken(accessToken);
    if (refreshToken) {
      await storageService.setRefreshToken(refreshToken);
    }
  }

  async clearTokens(): Promise<void> {
    this.memoryAccess = null;
    await storageService.clearAuth();
  }

  async getRefreshToken(): Promise<string | null> {
    return storageService.getRefreshToken();
  }

  async hasValidSession(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    if (accessToken) return true;
    const refreshToken = await this.getRefreshToken();
    return !!refreshToken && isRefreshTokenPresent(refreshToken);
  }
}

export const tokenService = new TokenService();
