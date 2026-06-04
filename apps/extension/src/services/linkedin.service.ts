import { storageService, StorageKeys } from "./storage.service";
import type { LinkedInPageType } from "@linkai/types";

export interface LinkedInState {
  pageType: LinkedInPageType;
  url: string;
  lastExtracted?: Record<string, unknown>;
  updatedAt: string;
}

class LinkedInService {
  async saveState(state: LinkedInState): Promise<void> {
    await storageService.set(StorageKeys.LINKEDIN_STATE, state);
  }

  async getState(): Promise<LinkedInState | null> {
    return storageService.get<LinkedInState>(StorageKeys.LINKEDIN_STATE);
  }
}

export const linkedinService = new LinkedInService();
