export function Loader({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div
      className={`${dim} animate-spin rounded-full border-2 border-surface-border border-t-accent`}
      role="status"
    />
  );
}
