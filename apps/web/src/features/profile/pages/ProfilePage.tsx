import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as profileApi from "@/api/profile.api";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { ProfileStrength } from "@/components/dashboard/ProfileStrength";
import { Card, Input, Button, Alert, Loader } from "@/components/ui";
import { profileSchema, type ProfileFormData } from "../validators";
import { assetUrl } from "@/constants/config";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setProfile } from "@/store/profileSlice";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@linkai/types";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      dispatch(setProfile(profile));
      reset({
        ...profile,
        skills: profile.skills?.join(", ") ?? "",
      });
    }
  }, [profile, reset, dispatch]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      profileApi.updateProfile({
        ...data,
        skills: data.skills?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
      }),
    onSuccess: (p) => {
      dispatch(setProfile(p));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardOverview"] });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  if (isLoading) return <Loader />;

  const apiError = (updateMutation.error as AxiosError<ApiResponse>)?.response?.data?.message;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Profile" }]} />
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1" animate={false}>
          <div className="flex flex-col items-center text-center">
            {profile?.avatar ? (
              <img src={assetUrl(profile.avatar)} alt="" className="h-24 w-24 rounded-full object-cover border-2 border-surface-border" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent">
                {profile?.firstName?.[0] ?? "?"}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) avatarMutation.mutate(f);
            }} />
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} isLoading={avatarMutation.isPending}>
                Upload photo
              </Button>
              {profile?.avatar && (
                <Button size="sm" variant="ghost" onClick={() => deleteAvatarMutation.mutate()} isLoading={deleteAvatarMutation.isPending}>
                  Remove
                </Button>
              )}
            </div>
            <div className="mt-6 w-full">
              <ProfileStrength score={profile?.profileScore ?? 0} />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2" animate={false}>
          {apiError && <Alert variant="error" message={apiError} className="mb-4" />}
          {updateMutation.isSuccess && <Alert variant="success" message="Profile saved" className="mb-4" />}

          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <Input label="Headline" error={errors.headline?.message} {...register("headline")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Current position" error={errors.position?.message} {...register("position")} />
              <Input label="Company" error={errors.company?.message} {...register("company")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Industry" error={errors.industry?.message} {...register("industry")} />
              <Input label="Location" error={errors.location?.message} {...register("location")} />
            </div>
            <Input label="Years of experience" type="number" error={errors.experienceYears?.message} {...register("experienceYears")} />
            <Input label="Skills (comma-separated)" error={errors.skills?.message} {...register("skills")} />
            <Input label="Website" error={errors.website?.message} {...register("website")} />
            <Input label="GitHub" error={errors.github?.message} {...register("github")} />
            <Input label="Portfolio" error={errors.portfolio?.message} {...register("portfolio")} />
            <Input label="LinkedIn URL" error={errors.linkedinUrl?.message} {...register("linkedinUrl")} />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio</label>
              <textarea
                className="w-full rounded-lg border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white min-h-[120px] focus:ring-2 focus:ring-accent/40"
                {...register("bio")}
              />
            </div>
            <Button type="submit" isLoading={updateMutation.isPending}>Save profile</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
