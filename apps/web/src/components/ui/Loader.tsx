import { cn } from "@/utils/cn";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Loader({ size = "md", className, fullScreen = false }: LoaderProps) {
  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-surface-border border-t-accent",
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
