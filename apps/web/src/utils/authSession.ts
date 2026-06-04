import type { QueryClient } from "@tanstack/react-query";
import type { IUser } from "@linkai/types";
import { setAccessToken, setRefreshToken, clearAuthTokens } from "@/api/axios";
import { syncAuthToExtension, notifyExtensionLogout } from "@/utils/extensionBridge";

export const CURRENT_USER_QUERY_KEY = ["currentUser"] as const;

export function establishAuthSession(
  queryClient: QueryClient,
  user: IUser,
  accessToken: string,
  refreshToken?: string
): void {
  setAccessToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
  queryClient.cancelQueries({ queryKey: CURRENT_USER_QUERY_KEY });
  queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
  syncAuthToExtension(accessToken, refreshToken);
}

export function clearAuthSession(queryClient: QueryClient): void {
  clearAuthTokens();
  queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
  notifyExtensionLogout();
}
