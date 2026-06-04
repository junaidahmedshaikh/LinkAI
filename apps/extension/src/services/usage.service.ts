import { API_ROUTES } from "@linkai/shared";
import type {
  ApiResponse,
  ExtensionActivityType,
  IExtensionActivityPayload,
  IExtensionHeartbeatPayload,
} from "@linkai/types";
import { apiClient } from "./api.client";
import { EXTENSION_VERSION } from "@/utils/config";

class UsageService {
  async track(type: ExtensionActivityType, action: string, metadata?: Record<string, unknown>): Promise<void> {
    const payload: IExtensionActivityPayload = { type, action, metadata };
    await apiClient.post<ApiResponse<unknown>>(API_ROUTES.EXTENSION.ACTIVITY, payload);
  }

  async heartbeat(extra?: Partial<IExtensionHeartbeatPayload>): Promise<void> {
    await apiClient.post(API_ROUTES.EXTENSION.HEARTBEAT, {
      extensionVersion: EXTENSION_VERSION,
      ...extra,
    });
  }
}

export const usageService = new UsageService();
