import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input, Card, Alert } from "@/components/ui";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/features/auth/schemas";
import * as authApi from "@/api/auth.api";
import { ROUTES } from "@/constants/config";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordFormData) => authApi.forgotPassword(data.email),
    onSuccess: (result) => {
      if (result?.resetToken) {
        setDevToken(result.resetToken);
      }
      setSubmitted(true);
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <Card>
        {submitted ? (
          <div className="text-center space-y-4">
            <Alert
              variant="success"
              title="Check your inbox"
              message="If an account exists with this email, you'll receive a password reset link shortly."
            />
            {devToken && (
              <p className="text-xs text-muted break-all">
                Dev reset token:{" "}
                <Link to={`${ROUTES.RESET_PASSWORD}?token=${devToken}`} className="text-accent">
                  {devToken}
                </Link>
              </p>
            )}
            <Link to={ROUTES.LOGIN}>
              <Button variant="secondary" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" fullWidth isLoading={mutation.isPending}>
              Send reset link
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to={ROUTES.LOGIN} className="text-accent hover:text-accent-hover">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
}
