import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logout as logoutAction } from "@/store/authSlice";
import * as authApi from "@/api/auth.api";
import { clearAuthSession } from "@/utils/authSession";
import { ROUTES } from "@/constants/config";
import { Button } from "./Button";

export function Navbar() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuthSession(queryClient);
      dispatch(logoutAction());
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
            <span className="text-sm font-bold text-accent">L</span>
          </div>
          <span className="font-semibold text-white hidden sm:inline">LinkAI</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.fullName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
