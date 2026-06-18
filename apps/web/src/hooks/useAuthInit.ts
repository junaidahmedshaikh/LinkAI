import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { setUser, setLoading, logout } from "@/store/authSlice";
import { getAccessToken, getRefreshToken } from "@/api/axios";
import * as authApi from "@/api/auth.api";
import { clearAuthSession, CURRENT_USER_QUERY_KEY } from "@/utils/authSession";
import { syncAuthToExtension } from "@/utils/extensionBridge";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hydrates auth from API on cold start (token in localStorage, empty Redux).
 * After login/register, Redux is already populated — we skip fetching to avoid races.
 */
export function useAuthInit() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const hasToken = !!getAccessToken();

  const shouldFetchUser = hasToken && !isAuthenticated;

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: authApi.getCurrentUser,
    enabled: shouldFetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!hasToken) {
      dispatch(setLoading(false));
      return;
    }

    if (data) {
      dispatch(setUser(data));
      const accessToken = getAccessToken();
      if (accessToken) {
        syncAuthToExtension(accessToken, getRefreshToken() ?? undefined);
      }
    }
  }, [data, hasToken, dispatch]);

  useEffect(() => {
    if (isError && hasToken && !isAuthenticated) {
      const status = (error as AxiosError)?.response?.status;
      if (status === 401) {
        clearAuthSession(queryClient);
        dispatch(logout());
      }
    }
  }, [isError, error, hasToken, isAuthenticated, dispatch, queryClient]);

  useEffect(() => {
    if (!shouldFetchUser) {
      dispatch(setLoading(false));
    }
  }, [shouldFetchUser, dispatch]);

  const isInitializing = shouldFetchUser && (isLoading || isFetching);

  return { isInitializing };
}
