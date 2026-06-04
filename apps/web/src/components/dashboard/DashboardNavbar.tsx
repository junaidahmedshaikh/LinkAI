import { useState } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { assetUrl } from "@/constants/config";
interface DashboardNavbarProps {
  onMenuClick: () => void;
}

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const user = useAppSelector((s) => s.auth.user);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-surface-border bg-surface/90 backdrop-blur-md px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden lg:block flex-1" />

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-surface-border bg-surface-card p-4 shadow-glow">
                <p className="text-sm font-medium text-white">Notifications</p>
                <p className="mt-2 text-xs text-muted">No new notifications</p>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-white/5"
          >
            {user?.avatar ? (
              <img
                src={assetUrl(user.avatar)}
                alt=""
                className="h-8 w-8 rounded-full object-cover border border-surface-border"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
                {user?.fullName?.[0] ?? "U"}
              </div>
            )}
            <span className="hidden sm:inline text-sm text-white max-w-[120px] truncate">
              {user?.fullName}
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-surface-border bg-surface-card py-1 shadow-glow">
                <p className="px-4 py-2 text-xs text-muted truncate">{user?.email}</p>
                <p className="px-4 pb-2 text-xs capitalize text-accent">{user?.subscriptionPlan} plan</p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
