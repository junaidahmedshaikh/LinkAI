import { z } from "zod";

export const extensionConnectSchema = z.object({
  deviceId: z.string().min(8).max(128),
  extensionVersion: z.string().max(32).optional(),
  browser: z.string().max(200).optional(),
});

export const extensionDisconnectSchema = z.object({
  deviceId: z.string().min(8).max(128),
});

export const syncHeartbeatSchema = z.object({
  deviceId: z.string().min(8).max(128),
  extensionVersion: z.string().max(32).optional(),
  linkedInPage: z.string().max(64).optional(),
  linkedInUrl: z.string().max(500).optional(),
});
