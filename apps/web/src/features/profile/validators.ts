import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().max(60).optional(),
  lastName: z.string().max(60).optional(),
  headline: z.string().max(220).optional(),
  position: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  industry: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  experienceYears: z.coerce.number().min(0).max(70).optional(),
  skills: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  github: z.string().max(300).optional(),
  portfolio: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
