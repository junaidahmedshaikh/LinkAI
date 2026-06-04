import type { ApiResponse, IProfile } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getProfile(): Promise<IProfile> {
  const { data } = await apiClient.get<ApiResponse<{ profile: IProfile }>>(API_ROUTES.PROFILE.BASE);
  return data.data!.profile;
}

export async function updateProfile(payload: Partial<IProfile>): Promise<IProfile> {
  const { data } = await apiClient.put<ApiResponse<{ profile: IProfile }>>(
    API_ROUTES.PROFILE.BASE,
    payload
  );
  return data.data!.profile;
}

export async function uploadAvatar(file: File): Promise<IProfile> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post<ApiResponse<{ profile: IProfile }>>(
    API_ROUTES.PROFILE.AVATAR,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data!.profile;
}

export async function deleteAvatar(): Promise<IProfile> {
  const { data } = await apiClient.delete<ApiResponse<{ profile: IProfile }>>(
    API_ROUTES.PROFILE.AVATAR
  );
  return data.data!.profile;
}
