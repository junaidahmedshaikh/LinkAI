import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { removeToast } from "@/store/uiSlice";
import { cn } from "@/utils/cn";

export function NotificationToast() {
  const dispatch = useDispatch();
  const toasts = useSelector((s: RootState) => s.ui.toasts);

  return (
    <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-2 max-w-[280px]">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          message={t.message}
          variant={t.variant}
          onClose={() => dispatch(removeToast(t.id))}
        />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  variant,
  onClose,
}: {
  message: string;
  variant: "info" | "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs shadow-lg",
        variant === "error" && "border-red-500/40 bg-red-500/10 text-red-200",
        variant === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        variant === "info" && "border-surface-border bg-surface-card text-zinc-200"
      )}
    >
      {message}
    </div>
  );
}
