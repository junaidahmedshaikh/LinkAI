import { cn } from "@/utils/cn";

interface ProfileStrengthProps {
  score: number;
  label?: string;
  className?: string;
}

export function ProfileStrength({ score, label = "Profile strength", className }: ProfileStrengthProps) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-accent";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-white">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
