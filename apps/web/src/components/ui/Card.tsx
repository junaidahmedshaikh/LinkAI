import { HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  animate?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, animate = true, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-surface-border bg-surface-card/80 backdrop-blur-sm",
          "shadow-card p-6 sm:p-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );

    if (!animate) return content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
