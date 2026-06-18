import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as settingsApi from "@/api/settings.api";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { SettingsSection } from "@/components/dashboard/SettingsSection";
import { Input, Button, Alert, Loader } from "@/components/ui";
import { useAppSelector } from "@/hooks/useAppDispatch";
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.getSettings,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: settingsApi.getSessions,
  });

  const notifForm = useForm({
    defaultValues: {
      emailNotifications: true,
      productUpdates: true,
      featureAnnouncements: true,
      marketingEmails: false,
      theme: "dark" as "dark" | "light" | "system",
      language: "en",
      timezone: "UTC",
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (settings) {
      notifForm.reset({
        ...settings.notifications,
        ...settings.preferences,
      });
    }
  }, [settings, notifForm]);

  const settingsMutation = useMutation({
    mutationFn: () =>
      settingsApi.updateSettings({
        notifications: {
          emailNotifications: notifForm.getValues("emailNotifications"),
          productUpdates: notifForm.getValues("productUpdates"),
          featureAnnouncements: notifForm.getValues("featureAnnouncements"),
          marketingEmails: notifForm.getValues("marketingEmails"),
        },
        preferences: {
          theme: notifForm.getValues("theme"),
          language: notifForm.getValues("language"),
          timezone: notifForm.getValues("timezone"),
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      const { currentPassword, newPassword, confirmPassword } =
        passwordForm.getValues();
      if (newPassword !== confirmPassword)
        throw new Error("Passwords do not match");
      return settingsApi.changePassword(currentPassword, newPassword);
    },
    onSuccess: () => {
      passwordForm.reset();
      alert("Password changed. Please sign in again on other devices.");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: settingsApi.logoutAllDevices,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  if (isLoading) return <Loader />;

  const pwError = (passwordMutation.error as Error)?.message;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "Settings" }]} />
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <SettingsSection title="Account" description="Your account information">
        <div className="grid gap-2 text-sm">
          <p>
            <span className="text-muted">Name:</span>{" "}
            <span className="text-white">{user?.fullName}</span>
          </p>
          <p>
            <span className="text-muted">Email:</span>{" "}
            <span className="text-white">{user?.email}</span>
          </p>
          <p>
            <span className="text-muted">Plan:</span>{" "}
            <span className="text-white capitalize">
              {user?.subscriptionPlan}
            </span>
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Manage email preferences"
      >
        {[
          "emailNotifications",
          "productUpdates",
          "featureAnnouncements",
          "marketingEmails",
        ].map((key) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-surface-border"
              {...notifForm.register(key as "emailNotifications")}
            />
            <span className="text-sm text-zinc-300 capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
          </label>
        ))}
        <Button
          onClick={() => settingsMutation.mutate()}
          isLoading={settingsMutation.isPending}
        >
          Save notifications
        </Button>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-zinc-300">Theme</label>
            <select
              className="mt-1 w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white"
              {...notifForm.register("theme")}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <Input label="Language" {...notifForm.register("language")} />
          <Input label="Timezone" {...notifForm.register("timezone")} />
        </div>
        <Button
          onClick={() => settingsMutation.mutate()}
          isLoading={settingsMutation.isPending}
        >
          Save preferences
        </Button>
      </SettingsSection>

      <SettingsSection title="Security" description="Password and sessions">
        {user?.provider !== "local" ? (
          <Alert
            variant="info"
            message="Password change is only available for email/password accounts."
          />
        ) : (
          <form
            onSubmit={passwordForm.handleSubmit(() =>
              passwordMutation.mutate(),
            )}
            className="space-y-4 max-w-md"
          >
            {pwError && <Alert variant="error" message={pwError} />}
            <Input
              label="Current password"
              type="password"
              {...passwordForm.register("currentPassword", { required: true })}
            />
            <Input
              label="New password"
              type="password"
              {...passwordForm.register("newPassword", {
                required: true,
                minLength: 8,
              })}
            />
            <Input
              label="Confirm password"
              type="password"
              {...passwordForm.register("confirmPassword", { required: true })}
            />
            <Button type="submit" isLoading={passwordMutation.isPending}>
              Change password
            </Button>
          </form>
        )}
        <div className="pt-4 border-t border-surface-border">
          <Button
            variant="danger"
            onClick={() => logoutAllMutation.mutate()}
            isLoading={logoutAllMutation.isPending}
          >
            Logout from all devices
          </Button>
        </div>
        <div className="pt-4">
          <h3 className="text-sm font-medium text-white mb-3">Recent logins</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {sessions?.slice(0, 10).map((s) => (
              <li
                key={s._id}
                className="flex justify-between border-b border-surface-border/50 pb-2"
              >
                <span>
                  {s.ip ?? "Unknown IP"} · {s.isActive ? "Active" : "Ended"}
                </span>
                <span>{new Date(s.createdAt).toLocaleString()}</span>
              </li>
            ))}
            {(!sessions || sessions.length === 0) && (
              <li>No session history yet</li>
            )}
          </ul>
        </div>
      </SettingsSection>

      {settingsMutation.isSuccess && (
        <Alert variant="success" message="Settings saved" />
      )}
    </div>
  );
}
