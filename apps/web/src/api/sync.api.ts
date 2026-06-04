import type { ApiResponse, ISessionDevice, ISyncUserResponse } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getSyncUser(): Promise<ISyncUserResponse> {
  const { data } = await apiClient.get<ApiResponse<ISyncUserResponse>>(API_ROUTES.SYNC.USER);
  return data.data!;
}

export async function getSessions(): Promise<ISessionDevice[]> {
  const { data } = await apiClient.get<ApiResponse<{ sessions: ISessionDevice[] }>>(
    API_ROUTES.SECURITY.SESSIONS
  );
  return data.data!.sessions;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.SECURITY.REVOKE_SESSION(sessionId));
}

export async function logoutAllDevices(): Promise<void> {
  await apiClient.post(API_ROUTES.SECURITY.LOGOUT_ALL);
}
