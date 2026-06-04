import { motion } from "framer-motion";
import { MainLayout } from "@/layouts/MainLayout";
import { Card } from "@/components/ui";
import { useAppSelector } from "@/hooks/useAppDispatch";

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {user?.fullName}. AI features arrive in Phase 2.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card animate={false}>
            <p className="text-sm text-muted uppercase tracking-wide">Plan</p>
            <p className="mt-2 text-xl font-semibold capitalize text-white">
              {user?.subscriptionPlan ?? "free"}
            </p>
          </Card>
          <Card animate={false}>
            <p className="text-sm text-muted uppercase tracking-wide">Role</p>
            <p className="mt-2 text-xl font-semibold capitalize text-white">
              {user?.role ?? "user"}
            </p>
          </Card>
          <Card animate={false}>
            <p className="text-sm text-muted uppercase tracking-wide">Profile</p>
            <p className="mt-2 text-lg font-medium text-white">
              {user?.profile?.jobTitle ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.profile?.industry} · {user?.profile?.experienceLevel}
            </p>
          </Card>
        </div>

        <Card className="mt-6" animate={false}>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Authentication system active. Phase 2 will add AI content generation, analytics, and Chrome extension sync.
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
