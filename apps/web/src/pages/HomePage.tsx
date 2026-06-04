import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/config";
import { useAppSelector } from "@/hooks/useAppDispatch";

export default function HomePage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-medium text-accent mb-6">
            AI LinkedIn Assistant · Phase 1
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-gradient leading-tight">
            Grow your LinkedIn with AI
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Professional content, smart networking, and profile insights — built for modern careers.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button size="lg">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg">Get started free</Button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-20 grid gap-4 sm:grid-cols-3 max-w-4xl w-full"
        >
          {[
            { title: "Secure Auth", desc: "JWT, OAuth, RBAC-ready" },
            { title: "SaaS Architecture", desc: "Scalable monorepo foundation" },
            { title: "Phase 2 Ready", desc: "AI features & extension next" },
          ].map((item) => (
            <Card key={item.title} animate={false} className="text-left">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
