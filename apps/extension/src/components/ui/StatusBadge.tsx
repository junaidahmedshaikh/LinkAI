import { cn } from "@linkai/ui";

export function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "muted";
}) {
  const styles = {
    default: "bg-accent/15 text-accent border-accent/30",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    muted: "bg-zinc-500/15 text-zinc-400 border-zinc-600",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase", styles[variant])}>
      {label}
    </span>
  );
}
