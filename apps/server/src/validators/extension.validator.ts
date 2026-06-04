import { z } from "zod";
import { EXTENSION_ACTIVITY_TYPES, LINKEDIN_PAGE_TYPES } from "@linkai/shared";

export const extensionActivitySchema = z.object({
  type: z.enum(EXTENSION_ACTIVITY_TYPES),
  action: z.string().min(1).max(300),
  metadata: z.record(z.unknown()).optional(),
});

export const extensionHeartbeatSchema = z.object({
  extensionVersion: z.string().max(32).optional(),
  linkedInPage: z.enum(LINKEDIN_PAGE_TYPES).optional(),
  linkedInUrl: z.string().url().max(500).optional().or(z.literal("")),
});
