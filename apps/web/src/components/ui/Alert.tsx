import { cn } from "@/utils/cn";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  info: "bg-blue-500/10 border-blue-500/30 text-blue-200",
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-200",
  error: "bg-red-500/10 border-red-500/30 text-red-200",
};

export function Alert({ variant = "info", title, message, className, onClose }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {title && <p className="font-medium mb-0.5">{title}</p>}
          <p className={title ? "opacity-90" : ""}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
