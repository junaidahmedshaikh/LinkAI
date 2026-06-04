import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input, Card, Alert } from "@/components/ui";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/features/auth/schemas";
import * as authApi from "@/api/auth.api";
import { ROUTES } from "@/constants/config";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@linkai/types";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) =>
      authApi.resetPassword(token, data.password),
    onSuccess: () => navigate(ROUTES.LOGIN),
    onError: (error: AxiosError<ApiResponse>) => {
      setApiError(error.response?.data?.message || "Failed to reset password.");
    },
  });

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is invalid or has expired">
        <Card>
          <Alert variant="error" message="Missing reset token. Please request a new reset link." />
          <Link to={ROUTES.FORGOT_PASSWORD} className="block mt-4">
            <Button fullWidth>Request new link</Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <Card>
        {apiError && <Alert variant="error" message={apiError} className="mb-6" />}

        <form
          onSubmit={handleSubmit((data) => {
            setApiError(null);
            mutation.mutate(data);
          })}
          className="space-y-4"
        >
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" fullWidth isLoading={mutation.isPending}>
            Reset password
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
