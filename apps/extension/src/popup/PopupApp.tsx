import { useState } from "react";
import { useSelector } from "react-redux";
import { useExtensionAuth } from "@/hooks/useExtensionAuth";
import { MessageType, sendMessage } from "@/services/messaging.service";
import { WEB_APP_URL } from "@/utils/config";
import type { RootState } from "@/store";
import { Loader } from "@/components/ui/Loader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UsageCard } from "@/components/ui/UsageCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SidebarCard } from "@/components/ui/SidebarCard";

export default function PopupApp() {
  const { isAuthenticated, loading, user, login, logout, error } = useExtensionAuth();
  const profile = useSelector((s: RootState) => s.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const openSidePanel = () => {
    void sendMessage({ type: MessageType.UI_OPEN_SIDE_PANEL });
  };

  if (loading) {
    return (
      <div className="flex h-[420px] items-center justify-center w-[360px]">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="w-[360px] p-5">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent font-bold text-lg">
            L
          </div>
          <h1 className="text-lg font-semibold">LinkAI</h1>
          <p className="text-xs text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        {error && <p className="mb-3 text-xs text-red-400 text-center">{error}</p>}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void login(email, password);
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
            Sign in
          </button>
        </form>
        <a href={`${WEB_APP_URL}/register`} target="_blank" rel="noreferrer" className="mt-4 block text-center text-xs text-accent">
          Create account →
        </a>
      </div>
    );
  }

  const stats = profile?.usage;

  return (
    <div className="w-[360px] p-4 space-y-4 max-h-[520px] overflow-y-auto">
      <div className="flex items-center gap-3">
        <UserAvatar name={user.fullName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{user.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <StatusBadge label={user.subscriptionPlan} />
      </div>

      <SidebarCard title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openSidePanel} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white">
            Open assistant
          </button>
          <a href={`${WEB_APP_URL}/dashboard`} target="_blank" rel="noreferrer" className="rounded-lg border border-surface-border px-3 py-1.5 text-xs">
            Dashboard
          </a>
          <button type="button" onClick={() => void logout()} className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-red-300">
            Sign out
          </button>
        </div>
      </SidebarCard>

      {stats && (
        <SidebarCard title="Usage">
          <div className="grid grid-cols-2 gap-2">
            <UsageCard label="Comments" value={stats.commentsGenerated} />
            <UsageCard label="Posts" value={stats.postsRewritten} />
            <UsageCard label="Connections" value={stats.connectionRequests} />
            <UsageCard label="Applications" value={stats.applicationsTracked} />
          </div>
        </SidebarCard>
      )}

      <SidebarCard title="AI features">
        <div className="space-y-2">
          <FeatureCard
            title="Comment generator"
            description="AI replies on LinkedIn posts"
            status="Ready"
            onClick={openSidePanel}
          />
          <FeatureCard title="Post rewriter" description="Improve your LinkedIn content" />
          <FeatureCard title="Easy apply" description="Smart job applications" />
        </div>
      </SidebarCard>
    </div>
  );
}
