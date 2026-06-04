import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  headline: z.string().max(220).optional(),
  position: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  industry: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  experienceYears: z.coerce.number().min(0).max(70).optional(),
  skills: z.array(z.string().max(80)).max(50).optional(),
  website: z.string().url().max(300).optional().or(z.literal("")),
  github: z.string().max(300).optional(),
  portfolio: z.string().url().max(300).optional().or(z.literal("")),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().max(300).optional().or(z.literal("")),
});

export const linkedInProfileSchema = z.object({
  linkedinUrl: z.string().url().max(300).optional().or(z.literal("")),
  headline: z.string().max(220).optional(),
  about: z.string().max(3000).optional(),
  experience: z
    .array(
      z.object({
        title: z.string().max(120).optional(),
        company: z.string().max(120).optional(),
        duration: z.string().max(80).optional(),
        description: z.string().max(1000).optional(),
      })
    )
    .max(20)
    .optional(),
  education: z
    .array(
      z.object({
        school: z.string().max(120).optional(),
        degree: z.string().max(120).optional(),
        year: z.string().max(20).optional(),
      })
    )
    .max(20)
    .optional(),
  skills: z.array(z.string().max(80)).max(50).optional(),
  connections: z.coerce.number().min(0).optional(),
  followers: z.coerce.number().min(0).optional(),
});

export const updateSettingsSchema = z.object({
  notifications: z
    .object({
      emailNotifications: z.boolean().optional(),
      productUpdates: z.boolean().optional(),
      featureAnnouncements: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(["dark", "light", "system"]).optional(),
      language: z.string().max(10).optional(),
      timezone: z.string().max(60).optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

export const activityQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});
