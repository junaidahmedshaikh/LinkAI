import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { getAccessToken } from "@/api/axios";
import { Loader } from "@/components/ui";
import { ROUTES } from "@/constants/config";

interface ProtectedRouteProps {
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ requireOnboarding = true }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const hasToken = !!getAccessToken();
  const isLoggedIn = isAuthenticated && !!user;

  if ((loading || hasToken) && !user) {
    return <Loader fullScreen />;
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (
    requireOnboarding &&
    !user?.profile?.onboardingCompleted &&
    location.pathname !== ROUTES.ONBOARDING
  ) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  if (user?.profile?.onboardingCompleted && location.pathname === ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
