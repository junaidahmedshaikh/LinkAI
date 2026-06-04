import { API_ROUTES } from "@linkai/shared";
import type {
  ApiResponse,
  IExtensionConnectPayload,
  IExtensionConnectResponse,
  ISyncHeartbeatPayload,
  ISyncHeartbeatResponse,
  ISyncUserResponse,
} from "@linkai/types";
import { apiClient } from "./api.client";
import { extensionSessionService } from "./session.service";
import { extensionCacheService } from "./cache.service";
import { tokenService } from "./token.service";
import { EXTENSION_VERSION } from "@/utils/config";

class SyncService {
  async connect(): Promise<IExtensionConnectResponse | null> {
    if (!(await tokenService.hasValidSession())) return null;

    const deviceId = await extensionSessionService.getDeviceId();
    const refreshToken = await tokenService.getRefreshToken();

    const payload: IExtensionConnectPayload = {
      deviceId,
      extensionVersion: EXTENSION_VERSION,
      browser: "Chrome Extension",
    };

    const { data } = await apiClient.post<ApiResponse<IExtensionConnectResponse>>(
      API_ROUTES.EXTENSION.CONNECT,
      { ...payload, refreshToken }
    );

    const result = data.data!;
    await extensionSessionService.setSessionId(result.sessionId);
    await extensionCacheService.setSyncUser(result);
    return result;
  }

  async disconnect(): Promise<void> {
    const deviceId = await extensionSessionService.getDeviceId();
    try {
      await apiClient.post(API_ROUTES.EXTENSION.DISCONNECT, { deviceId });
    } finally {
      await extensionSessionService.clearSession();
      await extensionCacheService.clear();
    }
  }

  async fetchUser(): Promise<ISyncUserResponse> {
    const { data } = await apiClient.get<ApiResponse<ISyncUserResponse>>(API_ROUTES.SYNC.USER);
    const result = data.data!;
    await extensionCacheService.setSyncUser(result);
    return result;
  }

  async getCachedOrFetch(): Promise<ISyncUserResponse | null> {
    const cached = await extensionCacheService.getSyncUser();
    if (cached && "extensionStatus" in cached) return cached as ISyncUserResponse;
    if (!(await tokenService.hasValidSession())) return cached as ISyncUserResponse | null;
    try {
      return await this.fetchUser();
    } catch {
      return cached as ISyncUserResponse | null;
    }
  }

  async heartbeat(linkedInPage?: string, linkedInUrl?: string): Promise<ISyncHeartbeatResponse | null> {
    if (!(await tokenService.hasValidSession())) return null;

    const payload: ISyncHeartbeatPayload = {
      deviceId: await extensionSessionService.getDeviceId(),
      extensionVersion: EXTENSION_VERSION,
      linkedInPage,
      linkedInUrl,
    };

    const { data } = await apiClient.post<ApiResponse<ISyncHeartbeatResponse>>(
      API_ROUTES.SYNC.HEARTBEAT,
      payload
    );
    return data.data!;
  }
}

export const syncService = new SyncService();
