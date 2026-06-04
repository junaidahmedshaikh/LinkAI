export function UsageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-elevated px-3 py-2">
      <p className="text-[10px] uppercase text-muted">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
