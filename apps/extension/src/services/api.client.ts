import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_ROUTES } from "@linkai/shared";
import { API_BASE_URL } from "@/utils/config";
import { tokenService } from "./token.service";
import { storageService } from "./storage.service";
import { debugLog } from "@/utils/debug";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenService.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = false;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    if (refreshing) return Promise.reject(error);
    refreshing = true;

    try {
      const refreshToken = await storageService.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(
        `${API_BASE_URL}${API_ROUTES.AUTH.REFRESH}`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccess = data.data?.accessToken as string;
      const newRefresh = data.data?.refreshToken as string | undefined;
      if (!newAccess) throw new Error("Refresh failed");

      await tokenService.setTokens(newAccess, newRefresh ?? refreshToken);
      if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (e) {
      await tokenService.clearTokens();
      debugLog("api", "session expired", e);
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  }
);
