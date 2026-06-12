import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useExtensionAuth } from "@/hooks/useExtensionAuth";
import { MessageType } from "@/services/messaging.service";
import type { RootState } from "@/store";
import { setLinkedInContext } from "@/store/linkedinSlice";
import { CommentGenerator } from "@/components/CommentGenerator";
import { Loader } from "@/components/ui/Loader";
import { SidebarCard } from "@/components/ui/SidebarCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { UsageCard } from "@/components/ui/UsageCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WEB_APP_URL } from "@/utils/config";

export default function SidePanelApp() {
  const { isAuthenticated, loading, user, hydrate } = useExtensionAuth();
  const syncUser = useSelector((s: RootState) => s.user);
  const linkedin = useSelector((s: RootState) => s.linkedin);
  const dispatch = useDispatch();

  const usage = syncUser?.usage;
  const flags = syncUser?.featureFlags ?? [];
  const commentsEnabled = flags.find((f) => f.key === "AI_COMMENTS")?.enabled ?? true;
  const onFeedOrPost = linkedin.pageType === "feed" || linkedin.pageType === "post";

  useEffect(() => {
    const listener = (message: {
      type?: string;
      payload?: { pageType: string; url: string; activePost?: unknown };
    }) => {
      if (message.type === MessageType.LINKEDIN_PAGE_CHANGED && message.payload) {
        dispatch(
          setLinkedInContext({
            pageType: message.payload.pageType as typeof linkedin.pageType,
            url: message.payload.url,
            isOnLinkedIn: true,
          })
        );
      }
      if (message.type === MessageType.LINKEDIN_DATA_EXTRACTED && message.payload) {
        dispatch(setLinkedInContext({ lastExtracted: message.payload as Record<string, unknown> }));
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [dispatch, linkedin.pageType]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-6">
        <EmptyState
          title="Sign in required"
          description="Sign in on the web app or extension popup. Sessions sync automatically."
        />
        <a href={`${WEB_APP_URL}/login`} target="_blank" rel="noreferrer" className="mt-4 block text-center text-sm text-accent">
          Open web app →
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-4 pb-8">
      <header className="flex items-center gap-3 border-b border-surface-border pb-4">
        <UserAvatar name={user.fullName} size={44} />
        <div>
          <h1 className="font-semibold">LinkAI Assistant</h1>
          <p className="text-xs text-muted-foreground">Synced with your dashboard</p>
        </div>
      </header>

      <CommentGenerator enabled={commentsEnabled} onUsageUpdate={() => void hydrate()} />

      {!onFeedOrPost && (
        <SidebarCard title="Tip">
          <p className="text-xs text-muted-foreground">
            Open the LinkedIn feed or a post to use the comment generator.
          </p>
        </SidebarCard>
      )}

      <SidebarCard title="LinkedIn context" action={<StatusBadge label={linkedin.pageType} variant={linkedin.isOnLinkedIn ? "success" : "muted"} />}>
        {linkedin.url ? (
          <p className="text-xs text-muted-foreground break-all">{linkedin.url}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Navigate to LinkedIn to activate detection.</p>
        )}
      </SidebarCard>

      {usage && (
        <SidebarCard title="Usage overview">
          <div className="grid grid-cols-2 gap-2">
            <UsageCard label="Comments" value={usage.commentsGenerated} />
            <UsageCard label="Rewrites" value={usage.postsRewritten} />
          </div>
        </SidebarCard>
      )}

      <SidebarCard title="More features">
        <div className="grid gap-2">
          <FeatureCard title="Post rewriter" description="Coming in Phase 5.2" />
          <FeatureCard title="Easy apply" description="Coming in Phase 5.3" />
        </div>
      </SidebarCard>

    </div>
  );
}
