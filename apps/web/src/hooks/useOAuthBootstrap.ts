import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { getAccessToken, apiClient } from "@/api/axios";
import { API_ROUTES } from "@linkai/shared";
import { login as loginAction } from "@/store/authSlice";
import { establishAuthSession } from "@/utils/authSession";
import type { ApiResponse, AuthTokensResponse } from "@linkai/types";

/** After Google/LinkedIn redirect, cookies exist but localStorage may be empty — refresh to get access token. */
export function useOAuthBootstrap() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (getAccessToken()) return;
    if (!location.pathname.startsWith("/dashboard")) return;

    attempted.current = true;

    (async () => {
      try {
        const { data } = await apiClient.post<ApiResponse<AuthTokensResponse>>(
          API_ROUTES.AUTH.REFRESH
        );
        const payload = data.data;
        if (payload?.accessToken && payload?.user) {
          dispatch(loginAction(payload.user));
          establishAuthSession(queryClient, payload.user, payload.accessToken, payload.refreshToken);
        }
      } catch {
        // Not an OAuth session or refresh unavailable — ProtectedRoute will redirect to login
      }
    })();
  }, [location.pathname, dispatch, queryClient]);
}
