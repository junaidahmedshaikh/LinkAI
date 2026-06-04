import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { ROUTES } from "@/constants/config";

export function AdminRoute() {
  const user = useAppSelector((s) => s.auth.user);

  if (user?.role !== "admin") {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
