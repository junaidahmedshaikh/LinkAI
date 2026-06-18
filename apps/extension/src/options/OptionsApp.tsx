import { useState } from "react";
import { useExtensionAuth } from "@/hooks/useExtensionAuth";
import {
  EXTENSION_VERSION,
  PRIVACY_POLICY_URL,
  TERMS_URL,
  WEB_APP_URL,
} from "@/utils/config";
import { Loader } from "@/components/ui/Loader";
import { SidebarCard } from "@/components/ui/SidebarCard";

export function OptionsApp() {
  const { isAuthenticated, loading, user, logout, error } = useExtensionAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">LinkAI</p>
          <h1 className="mt-2 text-3xl font-semibold">Extension options</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your extension session and jump back to the web app when needed.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Version {EXTENSION_VERSION}</p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <SidebarCard title="Account">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <p className="text-sm">
                Signed in as <span className="font-medium">{user.fullName}</span>
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={signingOut}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are not signed in. Sign in on the web app or in the popup to connect this
                extension.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${WEB_APP_URL}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
                >
                  Open login
                </a>
                <a
                  href={`${WEB_APP_URL}/register`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-surface-border px-4 py-2 text-sm"
                >
                  Create account
                </a>
              </div>
            </div>
          )}
        </SidebarCard>

        <SidebarCard title="Legal">
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Terms of Service
            </a>
          </div>
        </SidebarCard>
      </div>
    </div>
  );
}
