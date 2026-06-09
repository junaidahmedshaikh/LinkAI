import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthInit } from "@/hooks/useAuthInit";
import { PublicRoute } from "./PublicRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { Loader } from "@/components/ui";
import { ROUTES } from "@/constants/config";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import DashboardHomePage from "@/features/dashboard/pages/DashboardHomePage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import ResumesPage from "@/features/resume/pages/ResumesPage";
import LinkedInProfilePage from "@/features/linkedin-profile/pages/LinkedInProfilePage";
import ActivityPage from "@/features/activity/pages/ActivityPage";
import CommentsPage from "@/features/ai-comments/pages/CommentsPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import DevicesPage from "@/features/devices/pages/DevicesPage";
import AdminPage from "@/features/admin/pages/AdminPage";

export function AppRoutes() {
  const { isInitializing } = useAuthInit();

  if (isInitializing) {
    return <Loader fullScreen />;
  }

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />

      <Route element={<PublicRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute requireOnboarding={false} />}>
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
      </Route>

      <Route path="/dashboard" element={<ProtectedRoute requireOnboarding={false} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="resumes" element={<ResumesPage />} />
          <Route path="linkedin-profile" element={<LinkedInProfilePage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="comments" element={<CommentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
