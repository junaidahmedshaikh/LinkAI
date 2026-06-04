import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logout } from "@/store/authSlice";
import { onAuthSessionExpired } from "@/api/authBridge";
import { clearAuthSession } from "@/utils/authSession";
import { ROUTES } from "@/constants/config";

/** Handles global session expiry (e.g. refresh token invalid). */
export function useAuthSession() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthSessionExpired(() => {
      clearAuthSession(queryClient);
      dispatch(logout());
      navigate(ROUTES.LOGIN, { replace: true });
    });
  }, [dispatch, queryClient, navigate]);
}
