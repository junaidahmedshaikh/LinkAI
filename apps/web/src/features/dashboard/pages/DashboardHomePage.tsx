import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardOverview } from "@/api/dashboard.api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, Button, Loader } from "@/components/ui";
import { ExtensionStatusCard } from "@/components/dashboard/ExtensionStatusCard";
import { SyncStatusCard } from "@/components/dashboard/SyncStatusCard";
import { ROUTES } from "@/constants/config";

export default function DashboardHomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboardOverview"],
    queryFn: getDashboardOverview,
  });

  if (isLoading) return <Loader fullScreen />;

  if (isError || !data) {
    return (
      <Card animate={false} className="!p-6 text-center">
        <p className="text-white font-medium">Could not load dashboard</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check that the API server is running, then try again.
        </p>
        <Button className="mt-4" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const overview = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-muted-foreground">Your LinkedIn growth command center</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Usage statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Comments generated" value={overview.usageStats.commentsGenerated} />
          <StatsCard label="Posts rewritten" value={overview.usageStats.postsRewritten} />
          <StatsCard label="Connection requests" value={overview.usageStats.connectionRequests} />
          <StatsCard label="Applications tracked" value={overview.usageStats.applicationsTracked} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExtensionStatusCard status={overview.extensionStatus} />
        <SyncStatusCard />
      </div>

      <Card animate={false}>
        <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to={ROUTES.COMMENTS}>
            <Button size="sm">Open AI comments</Button>
          </Link>
          <Link to={ROUTES.SETTINGS}>
            <Button variant="secondary" size="sm">Open settings</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
