import type { ApiResponse, IUserSettings, ISession } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getSettings(): Promise<IUserSettings> {
  const { data } = await apiClient.get<ApiResponse<{ settings: IUserSettings }>>(
    API_ROUTES.SETTINGS.BASE
  );
  return data.data!.settings;
}

export async function updateSettings(
  payload: Partial<Pick<IUserSettings, "notifications" | "preferences">>
): Promise<IUserSettings> {
  const { data } = await apiClient.put<ApiResponse<{ settings: IUserSettings }>>(
    API_ROUTES.SETTINGS.BASE,
    payload
  );
  return data.data!.settings;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put(API_ROUTES.SECURITY.CHANGE_PASSWORD, { currentPassword, newPassword });
}

export async function logoutAllDevices(): Promise<void> {
  await apiClient.post(API_ROUTES.SECURITY.LOGOUT_ALL);
}

export async function getSessions(): Promise<ISession[]> {
  const { data } = await apiClient.get<ApiResponse<{ sessions: ISession[] }>>(
    API_ROUTES.SECURITY.SESSIONS
  );
  return data.data!.sessions;
}
