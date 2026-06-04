export function UserAvatar({ name, size = 40 }: { name?: string; size?: number }) {
  const initial = name?.[0]?.toUpperCase() ?? "L";
  return (
    <div
      className="flex items-center justify-center rounded-full bg-accent/20 text-accent font-semibold border border-accent/30"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
