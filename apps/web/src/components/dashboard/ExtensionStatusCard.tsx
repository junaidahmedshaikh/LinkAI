import type { IExtensionStatus } from "@linkai/types";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";

interface ExtensionStatusCardProps {
  status?: IExtensionStatus;
}

export function ExtensionStatusCard({ status }: ExtensionStatusCardProps) {
  const connected = status?.connected ?? false;

  return (
    <Card animate={false} className="!p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted">Chrome extension</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {connected ? "Connected" : "Not connected"}
          </p>
          {connected && status?.lastHeartbeatAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last seen {new Date(status.lastHeartbeatAt).toLocaleString()}
            </p>
          )}
          {status?.lastVersion && (
            <p className="text-xs text-muted mt-0.5">v{status.lastVersion}</p>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
            connected ? "bg-green-500/20 text-green-300" : "bg-zinc-500/20 text-zinc-400"
          )}
        >
          {connected ? "Online" : "Offline"}
        </span>
      </div>
    </Card>
  );
}
