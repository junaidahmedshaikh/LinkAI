export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-surface-border py-8 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground px-4">{description}</p>
    </div>
  );
}
