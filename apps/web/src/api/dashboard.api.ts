import type { ApiResponse, IDashboardOverview } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getDashboardOverview(): Promise<IDashboardOverview> {
  const { data } = await apiClient.get<ApiResponse<{ overview: IDashboardOverview }>>(
    API_ROUTES.DASHBOARD.OVERVIEW
  );
  return data.data!.overview;
}
