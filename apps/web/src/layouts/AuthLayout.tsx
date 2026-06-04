import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/config";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-surface-border">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-purple-900/20" />
          <div className="relative z-10 flex flex-col justify-between p-12">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/40">
                <span className="text-lg font-bold text-accent">L</span>
              </div>
              <span className="text-xl font-semibold text-white">LinkAI</span>
            </Link>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-gradient leading-tight"
              >
                Supercharge your
                <br />
                LinkedIn presence
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-lg text-muted-foreground max-w-md"
              >
                AI-powered content, networking insights, and profile optimization — built for professionals.
              </motion.p>
            </div>
            <p className="text-sm text-muted">© {new Date().getFullYear()} LinkAI. All rights reserved.</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
                  <span className="font-bold text-accent">L</span>
                </div>
                <span className="font-semibold text-white">LinkAI</span>
              </Link>
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
