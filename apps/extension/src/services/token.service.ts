import { storageService } from "./storage.service";

class TokenService {
  private memoryAccess: string | null = null;

  async getAccessToken(): Promise<string | null> {
    if (this.memoryAccess) return this.memoryAccess;
    const stored = await storageService.getAccessToken();
    this.memoryAccess = stored;
    return stored;
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
    const token = await this.getAccessToken();
    return !!token && token.length > 10;
  }
}

export const tokenService = new TokenService();
