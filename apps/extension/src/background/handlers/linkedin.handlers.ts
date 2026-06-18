import { authService } from "@/services/auth.service";
import { linkedinService } from "@/services/linkedin.service";
import { usageService } from "@/services/usage.service";
import type { LinkedInPageType } from "@linkai/types";
import type { MessageResponse } from "@/types/messages";

export async function handleLinkedInPageChanged(
  payload: unknown
): Promise<MessageResponse> {
  const { pageType, url } = payload as { pageType: string; url: string };

  await linkedinService.saveState({
    pageType: pageType as LinkedInPageType,
    url,
    updatedAt: new Date().toISOString(),
  });

  if (await authService.isAuthenticated()) {
    const activityType =
      pageType === "profile"
        ? "LINKEDIN_PROFILE_VIEWED"
        : pageType === "job" || pageType === "jobs"
          ? "JOB_VIEWED"
          : "PAGE_VISITED";
    await usageService.track(activityType, `Visited LinkedIn ${pageType}`, { url });
  }

  return { success: true };
}

export async function handleLinkedInDataExtracted(
  payload: unknown
): Promise<MessageResponse> {
  const state = await linkedinService.getState();
  if (state) {
    await linkedinService.saveState({
      ...state,
      lastExtracted: payload as Record<string, unknown>,
    });
  }
  return { success: true };
}
