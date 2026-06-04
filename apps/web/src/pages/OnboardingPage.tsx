import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MainLayout } from "@/layouts/MainLayout";
import { Button, Input, Card, Alert } from "@/components/ui";
import { onboardingSchema, type OnboardingFormData } from "@/features/auth/schemas";
import * as authApi from "@/api/auth.api";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { setUser } from "@/store/authSlice";
import { ROUTES } from "@/constants/config";
import { EXPERIENCE_LEVELS } from "@linkai/shared";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@linkai/types";

const experienceLabels: Record<string, string> = {
  entry: "Entry Level (0-2 years)",
  mid: "Mid Level (3-7 years)",
  senior: "Senior (8-15 years)",
  executive: "Executive (15+ years)",
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.completeOnboarding,
    onSuccess: (updatedUser) => {
      dispatch(setUser(updatedUser));
      navigate(ROUTES.DASHBOARD);
    },
  });

  const apiError =
    (mutation.error as AxiosError<ApiResponse>)?.response?.data?.message ||
    (mutation.isError ? "Failed to save onboarding. Please try again." : null);

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tell us about yourself so we can personalize your experience.
          </p>
        </motion.div>

        <Card>
          {apiError && <Alert variant="error" message={apiError} className="mb-6" />}

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
            <Input
              label="Current job title"
              placeholder="e.g. Senior Product Manager"
              error={errors.jobTitle?.message}
              {...register("jobTitle")}
            />
            <Input
              label="Industry"
              placeholder="e.g. Technology, Finance, Healthcare"
              error={errors.industry?.message}
              {...register("industry")}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">
                Experience level
              </label>
              <select
                className="w-full rounded-lg border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                {...register("experienceLevel")}
              >
                <option value="">Select level</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {experienceLabels[level]}
                  </option>
                ))}
              </select>
              {errors.experienceLevel && (
                <p className="text-xs text-red-400">{errors.experienceLevel.message}</p>
              )}
            </div>
            <Button type="submit" fullWidth isLoading={mutation.isPending} size="lg">
              Complete setup
            </Button>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
