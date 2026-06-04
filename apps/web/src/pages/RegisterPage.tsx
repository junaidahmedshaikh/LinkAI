import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input, Card, Alert } from "@/components/ui";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { registerSchema, type RegisterFormData } from "@/features/auth/schemas";
import * as authApi from "@/api/auth.api";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { login as loginAction } from "@/store/authSlice";
import { ROUTES } from "@/constants/config";
import { establishAuthSession } from "@/utils/authSession";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@linkai/types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: ({ fullName, email, password }: RegisterFormData) =>
      authApi.register({ fullName, email, password }),
    onSuccess: (data) => {
      if (!data?.accessToken || !data?.user) {
        setApiError("Invalid registration response. Please try again.");
        return;
      }
      dispatch(loginAction(data.user));
      establishAuthSession(queryClient, data.user, data.accessToken, data.refreshToken);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error: AxiosError<ApiResponse>) => {
      setApiError(error.response?.data?.message || "Registration failed. Please try again.");
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your AI-powered LinkedIn journey">
      <Card>
        {apiError && <Alert variant="error" message={apiError} className="mb-6" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
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
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" fullWidth isLoading={mutation.isPending}>
            Create account
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-card px-2 text-muted">or sign up with</span>
          </div>
        </div>

        <OAuthButtons mode="register" />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="text-accent hover:text-accent-hover font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
