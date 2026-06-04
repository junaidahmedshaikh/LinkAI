import { Card, Button, Loader } from "@/components/ui";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { getSessions, revokeSession, logoutAllDevices } from "@/api/sync.api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ISessionDevice } from "@linkai/types";
import { cn } from "@/utils/cn";

function deviceLabel(session: ISessionDevice): string {
  if (session.deviceType === "EXTENSION") return "Chrome Extension";
  if (session.deviceType === "MOBILE_FUTURE") return "Mobile App";
  return session.browser ?? "Web Browser";
}

function deviceIcon(type: ISessionDevice["deviceType"]): string {
  if (type === "EXTENSION") return "🧩";
  if (type === "MOBILE_FUTURE") return "📱";
  return "🌐";
}

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const logoutAllMutation = useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  if (isLoading) return <Loader fullScreen />;

  const active = sessions.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Devices" }]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Connected devices</h1>
          <p className="mt-1 text-muted-foreground">Manage web and extension sessions</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={logoutAllMutation.isPending}
          onClick={() => logoutAllMutation.mutate()}
        >
          Log out all devices
        </Button>
      </div>

      <div className="grid gap-4">
        {active.length === 0 && (
          <Card animate={false}>
            <p className="text-sm text-muted-foreground py-6 text-center">No active sessions</p>
          </Card>
        )}
        {active.map((session) => (
          <Card key={session._id} animate={false} className="!p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="text-2xl">{deviceIcon(session.deviceType)}</span>
                <div>
                  <p className="font-medium text-white">{deviceLabel(session)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {session.deviceType} · {session.ipAddress ?? "Unknown IP"}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Last active {new Date(session.lastActiveAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                    session.isActive ? "bg-green-500/20 text-green-300" : "bg-zinc-500/20 text-zinc-400"
                  )}
                >
                  {session.isActive ? "Active" : "Inactive"}
                </span>
                {session.isActive && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(session._id)}
                  >
                    Terminate
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
