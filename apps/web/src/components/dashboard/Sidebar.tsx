import { NavLink } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { ROUTES } from "@/constants/config";
import { cn } from "@/utils/cn";
import { useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth.api";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logout } from "@/store/authSlice";
import { clearAuthSession } from "@/utils/authSession";

const navItems = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: "◫" },
  { to: ROUTES.PROFILE, label: "Profile", icon: "◎" },
  { to: ROUTES.RESUMES, label: "Resume Manager", icon: "▤" },
  { to: ROUTES.LINKEDIN_PROFILE, label: "LinkedIn Profile", icon: "in" },
  { to: ROUTES.COMMENTS, label: "AI Comments", icon: "✨" },
  { to: ROUTES.ACTIVITY, label: "Activity", icon: "↻" },
  { to: ROUTES.DEVICES, label: "Devices", icon: "⬡" },
  { to: ROUTES.SETTINGS, label: "Settings", icon: "⚙" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuthSession(queryClient);
      dispatch(logout());
    }
  };

  return (
    <aside className="flex h-full flex-col border-r border-surface-border bg-surface-elevated/50">
      <div className="flex h-14 items-center gap-2 border-b border-surface-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
          <span className="text-sm font-bold text-accent">L</span>
        </div>
        <span className="font-semibold text-white">LinkAI</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.DASHBOARD}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/15 text-white border border-accent/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )
            }
          >
            <span className="w-5 text-center text-xs opacity-70">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to={ROUTES.ADMIN}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-500/15 text-amber-200"
                  : "text-muted-foreground hover:bg-white/5",
              )
            }
          >
            <span className="w-5 text-center text-xs">★</span>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="border-t border-surface-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <span className="w-5 text-center">⎋</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
