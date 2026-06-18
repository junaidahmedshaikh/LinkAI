import type { MessageResponse } from "@/types/messages";

export async function handleOpenSidePanel(): Promise<MessageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
  return { success: true };
}

export async function handlePing(): Promise<MessageResponse> {
  return { success: true, data: { pong: true } };
}
