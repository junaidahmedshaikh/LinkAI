import { API_ROUTES } from "@linkai/shared";
import type { ApiResponse, IExtensionMeResponse } from "@linkai/types";
import { apiClient } from "./api.client";

class ProfileService {
  async getExtensionMe(): Promise<IExtensionMeResponse> {
    const { data } = await apiClient.get<ApiResponse<IExtensionMeResponse>>(
      API_ROUTES.EXTENSION.ME
    );
    return data.data!;
  }
}

export const profileService = new ProfileService();
