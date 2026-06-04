import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input, Card, Alert } from "@/components/ui";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
import * as authApi from "@/api/auth.api";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { login as loginAction } from "@/store/authSlice";
import { ROUTES } from "@/constants/config";
import { establishAuthSession } from "@/utils/authSession";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@linkai/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (!data?.accessToken || !data?.user) {
        setApiError("Invalid login response. Please try again.");
        return;
      }
      dispatch(loginAction(data.user));
      establishAuthSession(queryClient, data.user, data.accessToken, data.refreshToken);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error: AxiosError<ApiResponse>) => {
      setApiError(error.response?.data?.message || "Login failed. Please try again.");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your LinkAI account">
      <Card>
        {(apiError || oauthError) && (
          <Alert
            variant="error"
            message={
              apiError ||
              (oauthError === "google_auth_failed"
                ? "Google sign-in failed. Please try again."
                : "OAuth sign-in failed. Please try again.")
            }
            className="mb-6"
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" fullWidth isLoading={mutation.isPending}>
            Sign in
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-card px-2 text-muted">or continue with</span>
          </div>
        </div>

        <OAuthButtons mode="login" />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to={ROUTES.REGISTER} className="text-accent hover:text-accent-hover font-medium">
            Create account
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
