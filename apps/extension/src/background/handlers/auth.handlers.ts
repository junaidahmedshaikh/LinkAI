import { authService } from "@/services/auth.service";
import { connectionService } from "@/services/connection.service";
import { syncService } from "@/services/sync.service";
import { usageService } from "@/services/usage.service";
import type { LoginPayload, RegisterPayload } from "@/types/messages";
import type { MessageResponse } from "@/types/messages";
import type { HandlerContext } from "./types";

function authErrorMessage(
  e: unknown,
  fallback: string
): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message ?? err.message ?? fallback;
}

async function postAuthSuccess(ctx: HandlerContext, activity: string): Promise<void> {
  await syncService.connect();
  ctx.startHeartbeat();
  await usageService.track("EXTENSION_OPENED", activity);
}

export async function handleAuthLogin(
  payload: unknown,
  ctx: HandlerContext
): Promise<MessageResponse> {
  const { email, password } = payload as LoginPayload;
  try {
    const user = await authService.login(email, password);
    await postAuthSuccess(ctx, "User logged in via extension");
    return { success: true, data: { user } };
  } catch (e) {
    return {
      success: false,
      error: authErrorMessage(e, "Invalid email or password"),
    };
  }
}

export async function handleAuthRegister(
  payload: unknown,
  ctx: HandlerContext
): Promise<MessageResponse> {
  const { fullName, email, password } = payload as RegisterPayload;
  try {
    const user = await authService.register(fullName, email, password);
    await postAuthSuccess(ctx, "User registered via extension");
    return { success: true, data: { user } };
  } catch (e) {
    return {
      success: false,
      error: authErrorMessage(e, "Registration failed"),
    };
  }
}

export async function handleAuthLogout(
  _payload: unknown,
  ctx: HandlerContext
): Promise<MessageResponse> {
  try {
    await syncService.disconnect();
  } catch {
    // continue logout
  }
  await authService.logout();
  ctx.stopHeartbeat();
  return { success: true };
}

export async function handleAuthSyncFromWeb(
  payload: unknown,
  ctx: HandlerContext
): Promise<MessageResponse> {
  const { accessToken, refreshToken } = payload as {
    accessToken: string;
    refreshToken?: string;
  };
  const ok = await connectionService.syncFromWeb(accessToken, refreshToken);
  if (ok) ctx.startHeartbeat();
  return { success: ok };
}

export async function handleAuthGetState(): Promise<MessageResponse> {
  const authed = await authService.isAuthenticated();
  const user = await authService.getCachedUser();
  return {
    success: true,
    data: { isAuthenticated: authed, userEmail: user?.email },
  };
}

export async function handleAuthRefresh(): Promise<MessageResponse> {
  try {
    const user = await authService.refreshSession();
    return { success: true, data: { user } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
