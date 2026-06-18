import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { SettingsSection } from "@/components/dashboard/SettingsSection";
import { Input, Button, Alert } from "@/components/ui";
import { profileSchema, type ProfileFormData } from "@/features/auth/schemas";
import * as authApi from "@/api/auth.api";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { setUser } from "@/store/authSlice";
import { CURRENT_USER_QUERY_KEY } from "@/utils/authSession";
import { requestExtensionSync } from "@/utils/extensionBridge";
import type { ApiResponse } from "@linkai/types";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      avatar: user?.avatar ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        avatar: user.avatar ?? "",
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      authApi.updateProfile({
        fullName: data.fullName,
        avatar: data.avatar || undefined,
      }),
    onSuccess: (updatedUser) => {
      dispatch(setUser(updatedUser));
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
      requestExtensionSync();
      setApiError(null);
      setSuccessMessage("Profile updated successfully");
    },
    onError: (error: AxiosError<ApiResponse>) => {
      setSuccessMessage(null);
      setApiError(error.response?.data?.message || "Failed to update profile");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setSuccessMessage(null);
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "Profile" }]} />
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      {successMessage && <Alert variant="success" message={successMessage} />}
      {apiError && <Alert variant="error" message={apiError} />}

      <SettingsSection
        title="Personal information"
        description="Updates sync across the web app and extension"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Email"
            value={user?.email ?? ""}
            disabled
            hint="Email cannot be changed"
          />
          <Input
            label="Avatar URL"
            placeholder="https://example.com/avatar.jpg"
            error={errors.avatar?.message}
            {...register("avatar")}
          />
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>
              <span className="text-muted">Plan:</span>{" "}
              <span className="capitalize text-white">
                {user?.subscriptionPlan}
              </span>
            </p>
            {user?.lastLoginAt && (
              <p>
                <span className="text-muted">Last login:</span>{" "}
                <span className="text-white">
                  {new Date(user.lastLoginAt).toLocaleString()}
                </span>
              </p>
            )}
            <p>
              <span className="text-muted">Member since:</span>{" "}
              <span className="text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </span>
            </p>
          </div>
          <Button type="submit" isLoading={mutation.isPending}>
            Save profile
          </Button>
        </form>
      </SettingsSection>
    </div>
  );
}
