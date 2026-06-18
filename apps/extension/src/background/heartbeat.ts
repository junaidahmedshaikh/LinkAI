import { authService } from "@/services/auth.service";
import { linkedinService } from "@/services/linkedin.service";
import { syncService } from "@/services/sync.service";
import { logger } from "@/utils/logger";

export const HEARTBEAT_ALARM_NAME = "linkai-heartbeat";
const HEARTBEAT_PERIOD_MINUTES = 5;

export async function runHeartbeat(): Promise<void> {
  if (!(await authService.isAuthenticated())) return;
  const state = await linkedinService.getState();
  try {
    await syncService.heartbeat(state?.pageType, state?.url);
  } catch (error) {
    logger.warn("heartbeat", "Sync heartbeat failed", error);
  }
}

export function startHeartbeat(): void {
  chrome.alarms.create(HEARTBEAT_ALARM_NAME, {
    periodInMinutes: HEARTBEAT_PERIOD_MINUTES,
  });
}

export function stopHeartbeat(): void {
  void chrome.alarms.clear(HEARTBEAT_ALARM_NAME);
}

export function registerHeartbeatAlarmListener(): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== HEARTBEAT_ALARM_NAME) return;
    void runHeartbeat();
  });
}
