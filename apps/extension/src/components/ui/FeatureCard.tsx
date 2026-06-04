import { StatusBadge } from "./StatusBadge";

export function FeatureCard({
  title,
  description,
  status = "Coming soon",
  onClick,
}: {
  title: string;
  description: string;
  status?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-surface-border bg-surface-elevated p-3 text-left transition hover:border-accent/40 disabled:opacity-60"
      disabled={!onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-white">{title}</span>
        <StatusBadge label={status} variant="muted" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
