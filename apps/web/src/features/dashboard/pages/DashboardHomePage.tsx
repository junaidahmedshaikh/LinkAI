import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardOverview } from "@/api/dashboard.api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProfileStrength } from "@/components/dashboard/ProfileStrength";
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card animate={false} className="!p-5">
          <ProfileStrength score={overview.profileCompletion} label="Profile completion" />
        </Card>
        <Card animate={false} className="!p-5 flex flex-col justify-center">
          <p className="text-xs uppercase text-muted">Resume</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {overview.resumeUploaded ? `${overview.resumeCount} uploaded` : "Not uploaded"}
          </p>
          <Link to={ROUTES.RESUMES} className="mt-2 text-xs text-accent hover:underline">
            Manage resumes →
          </Link>
        </Card>
        <Card animate={false} className="!p-5 flex flex-col justify-center">
          <p className="text-xs uppercase text-muted">LinkedIn</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {overview.linkedinConnected ? "Connected" : "Not connected"}
          </p>
          <Link to={ROUTES.LINKEDIN_PROFILE} className="mt-2 text-xs text-accent hover:underline">
            Edit profile →
          </Link>
        </Card>
        <Card animate={false} className="!p-5">
          <ProfileStrength score={overview.linkedinProfileScore} label="LinkedIn score" />
        </Card>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card animate={false}>
          <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.PROFILE}><Button size="sm">Edit profile</Button></Link>
            <Link to={ROUTES.RESUMES}><Button variant="secondary" size="sm">Upload resume</Button></Link>
            <Link to={ROUTES.LINKEDIN_PROFILE}><Button variant="secondary" size="sm">LinkedIn data</Button></Link>
          </div>
        </Card>
        <Card animate={false}>
          <h2 className="text-lg font-semibold text-white mb-2">Recent activity</h2>
          <ActivityFeed activities={overview.recentActivities} />
          <Link to={ROUTES.ACTIVITY} className="mt-4 inline-block text-sm text-accent hover:underline">
            View all activity →
          </Link>
        </Card>
      </div>
    </div>
  );
}
