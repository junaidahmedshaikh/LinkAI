import type {
  ApiResponse,
  AuthTokensResponse,
  LoginPayload,
  OnboardingPayload,
  RegisterPayload,
  UpdateProfilePayload,
  IUser,
} from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient, setAccessToken, setRefreshToken } from "./axios";
import { API_URL } from "@/constants/config";
import { getWebDeviceId } from "@/utils/deviceId";

export async function login(payload: LoginPayload): Promise<AuthTokensResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthTokensResponse>>(
    API_ROUTES.AUTH.LOGIN,
    { ...payload, deviceId: getWebDeviceId() }
  );
  if (data.data?.accessToken) {
    setAccessToken(data.data.accessToken);
  }
  if (data.data?.refreshToken) {
    setRefreshToken(data.data.refreshToken);
  }
  return data.data!;
}

export async function register(payload: RegisterPayload): Promise<AuthTokensResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthTokensResponse>>(
    API_ROUTES.AUTH.REGISTER,
    { ...payload, deviceId: getWebDeviceId() }
  );
  if (data.data?.accessToken) {
    setAccessToken(data.data.accessToken);
  }
  if (data.data?.refreshToken) {
    setRefreshToken(data.data.refreshToken);
  }
  return data.data!;
}

export async function logout(): Promise<void> {
  await apiClient.post(API_ROUTES.AUTH.LOGOUT);
  setAccessToken(null);
  setRefreshToken(null);
}

export async function getCurrentUser(): Promise<IUser> {
  const { data } = await apiClient.get<ApiResponse<{ user: IUser }>>(API_ROUTES.AUTH.ME);
  return data.data!.user;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<IUser> {
  const { data } = await apiClient.put<ApiResponse<{ user: IUser }>>(
    API_ROUTES.AUTH.PROFILE,
    payload
  );
  return data.data!.user;
}

export async function forgotPassword(
  email: string
): Promise<{ resetToken?: string } | void> {
  const { data } = await apiClient.post<ApiResponse<{ resetToken?: string }>>(
    API_ROUTES.AUTH.FORGOT_PASSWORD,
    { email }
  );
  return data.data;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post(API_ROUTES.AUTH.RESET_PASSWORD, { token, password });
}

export async function verifyEmail(token: string): Promise<IUser> {
  const { data } = await apiClient.get<ApiResponse<{ user: IUser }>>(
    API_ROUTES.AUTH.VERIFY_EMAIL,
    { params: { token } }
  );
  return data.data!.user;
}

export async function completeOnboarding(payload: OnboardingPayload): Promise<IUser> {
  const { data } = await apiClient.post<ApiResponse<{ user: IUser }>>(
    API_ROUTES.AUTH.ONBOARDING,
    payload
  );
  return data.data!.user;
}

export function getGoogleAuthUrl(): string {
  return `${API_URL}${API_ROUTES.AUTH.GOOGLE}`;
}

export function getLinkedInAuthUrl(): string {
  return `${API_URL}${API_ROUTES.AUTH.LINKEDIN}`;
}
