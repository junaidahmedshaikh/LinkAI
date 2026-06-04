import type { ApiResponse, ILinkedInProfile } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getLinkedInProfile(): Promise<ILinkedInProfile> {
  const { data } = await apiClient.get<ApiResponse<{ linkedInProfile: ILinkedInProfile }>>(
    API_ROUTES.LINKEDIN_PROFILE.BASE
  );
  return data.data!.linkedInProfile;
}

export async function updateLinkedInProfile(
  payload: Partial<ILinkedInProfile>
): Promise<ILinkedInProfile> {
  const { data } = await apiClient.put<ApiResponse<{ linkedInProfile: ILinkedInProfile }>>(
    API_ROUTES.LINKEDIN_PROFILE.BASE,
    payload
  );
  return data.data!.linkedInProfile;
}
