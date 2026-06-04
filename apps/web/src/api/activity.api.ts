import type { ApiResponse, PaginatedResponse, IActivity } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getActivities(page = 1, limit = 20): Promise<PaginatedResponse<IActivity>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<IActivity>>>(
    API_ROUTES.ACTIVITY.BASE,
    { params: { page, limit } }
  );
  return data.data!;
}
