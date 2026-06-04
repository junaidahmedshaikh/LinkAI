import type { IProfileDocument } from "../models/Profile.model";

const PROFILE_FIELDS: (keyof IProfileDocument)[] = [
  "firstName",
  "lastName",
  "headline",
  "position",
  "company",
  "industry",
  "location",
  "experienceYears",
  "website",
  "github",
  "portfolio",
  "bio",
  "avatar",
  "linkedinUrl",
];

export function calculateProfileScore(profile: Partial<IProfileDocument>): number {
  let filled = 0;
  const total = PROFILE_FIELDS.length + 1;

  for (const field of PROFILE_FIELDS) {
    const value = profile[field];
    if (value !== undefined && value !== null && value !== "") {
      filled += 1;
    }
  }

  if (profile.skills && profile.skills.length > 0) {
    filled += 1;
  }

  return Math.round((filled / total) * 100);
}

export function calculateLinkedInScore(data: {
  linkedinUrl?: string;
  headline?: string;
  about?: string;
  experience?: unknown[];
  education?: unknown[];
  skills?: string[];
}): number {
  const checks = [
    !!data.linkedinUrl,
    !!data.headline,
    !!data.about,
    (data.experience?.length ?? 0) > 0,
    (data.education?.length ?? 0) > 0,
    (data.skills?.length ?? 0) > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
