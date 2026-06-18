import { ReactNode } from "react";
import { cn } from "@linkai/ui";

export function SidebarCard({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-surface-border bg-surface-card p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
