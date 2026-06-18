import { useSelector } from "react-redux";
import { useExtensionAuth } from "@/hooks/useExtensionAuth";
import { MessageType, sendMessage } from "@/services/messaging.service";
import { WEB_APP_URL } from "@/utils/config";
import type { RootState } from "@/store";
import { Loader } from "@/components/ui/Loader";
import { AuthPanel } from "@/components/AuthPanel";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UsageCard } from "@/components/ui/UsageCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SidebarCard } from "@/components/ui/SidebarCard";

export default function PopupApp() {
  const { isAuthenticated, loading, user, login, register, logout, error } =
    useExtensionAuth();
  const profile = useSelector((s: RootState) => s.user);

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
      <AuthPanel
        loading={loading}
        error={error}
        onLogin={login}
        onRegister={register}
      />
    );
  }

  const stats = profile?.usage;
  const flags = profile?.featureFlags ?? [];
  const postRewriterEnabled =
    flags.find((f) => f.key === "AI_POST_REWRITER")?.enabled ?? false;
  const easyApplyEnabled =
    flags.find((f) => f.key === "AI_EASY_APPLY")?.enabled ?? false;

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
          <button
            type="button"
            onClick={openSidePanel}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white"
          >
            Open assistant
          </button>
          <a
            href={`${WEB_APP_URL}/dashboard`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs"
          >
            Dashboard
          </a>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-red-300"
          >
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
          {postRewriterEnabled ? (
            <FeatureCard
              title="Post rewriter"
              description="Improve your LinkedIn content"
              status="Ready"
            />
          ) : (
            <FeatureCard
              title="Post rewriter"
              description="Coming soon"
              status="Soon"
            />
          )}
          {easyApplyEnabled ? (
            <FeatureCard
              title="Easy apply"
              description="Smart job applications"
              status="Ready"
            />
          ) : (
            <FeatureCard
              title="Easy apply"
              description="Coming soon"
              status="Soon"
            />
          )}
        </div>
      </SidebarCard>
    </div>
  );
}
