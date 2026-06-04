import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { getAccessToken } from "@/api/axios";
import { Loader } from "@/components/ui";
import { ROUTES } from "@/constants/config";

export function PublicRoute() {
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const hasToken = !!getAccessToken();
  const isLoggedIn = isAuthenticated && !!user;

  if ((loading || hasToken) && !user) {
    return <Loader fullScreen />;
  }

  if (isLoggedIn) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
