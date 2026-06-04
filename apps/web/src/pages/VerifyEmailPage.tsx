import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Card, Alert, Loader } from "@/components/ui";
import * as authApi from "@/api/auth.api";
import { ROUTES } from "@/constants/config";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Invalid or expired verification link.");
      });
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <Card animate={false}>
        {status === "loading" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader size="lg" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-4"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">You&apos;re all set!</h3>
              <p className="mt-2 text-muted-foreground">{message}</p>
            </div>
            <Link to={ROUTES.LOGIN}>
              <Button fullWidth>Continue to sign in</Button>
            </Link>
          </motion.div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <Alert variant="error" message={message} />
            <Link to={ROUTES.LOGIN}>
              <Button variant="secondary" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}
