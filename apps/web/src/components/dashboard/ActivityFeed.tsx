import type { IActivity } from "@linkai/types";
import { cn } from "@/utils/cn";

const typeColors: Record<string, string> = {
  PROFILE_UPDATED: "bg-blue-500/20 text-blue-300",
  RESUME_UPLOADED: "bg-emerald-500/20 text-emerald-300",
  RESUME_DELETED: "bg-red-500/20 text-red-300",
  LOGIN: "bg-purple-500/20 text-purple-300",
  LOGOUT: "bg-zinc-500/20 text-zinc-300",
  LINKEDIN_UPDATED: "bg-sky-500/20 text-sky-300",
  SETTINGS_UPDATED: "bg-amber-500/20 text-amber-300",
  PASSWORD_CHANGED: "bg-orange-500/20 text-orange-300",
  AVATAR_UPLOADED: "bg-indigo-500/20 text-indigo-300",
  AVATAR_DELETED: "bg-zinc-500/20 text-zinc-300",
  EXTENSION_OPENED: "bg-indigo-500/20 text-indigo-300",
  PAGE_VISITED: "bg-sky-500/20 text-sky-300",
  LINKEDIN_PROFILE_VIEWED: "bg-cyan-500/20 text-cyan-300",
  JOB_VIEWED: "bg-teal-500/20 text-teal-300",
  FEATURE_CLICKED: "bg-violet-500/20 text-violet-300",
  EXTENSION_CONNECTED: "bg-green-500/20 text-green-300",
  EXTENSION_DISCONNECTED: "bg-red-500/20 text-red-300",
  SESSION_REVOKED: "bg-orange-500/20 text-orange-300",
  WEB_VISIT: "bg-blue-500/20 text-blue-300",
  COMMENT_GENERATED: "bg-indigo-500/20 text-indigo-300",
};

interface ActivityFeedProps {
  activities: IActivity[];
  emptyMessage?: string;
}

export function ActivityFeed({ activities, emptyMessage = "No activity yet" }: ActivityFeedProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-surface-border">
      {activities.map((activity) => (
        <li key={activity._id} className="flex gap-3 py-4 first:pt-0">
          <span
            className={cn(
              "shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase",
              typeColors[activity.type] ?? "bg-zinc-500/20 text-zinc-300"
            )}
          >
            {activity.type.replace(/_/g, " ")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">{activity.action}</p>
            <p className="text-xs text-muted mt-0.5">
              {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
