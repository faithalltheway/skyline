import { z } from "zod";
import { AccessibilityFeature, Interest } from "@prisma/client";

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  avatarUrl: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().min(1, "State is required").max(2),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  interests: z.array(z.nativeEnum(Interest)).default([]),
  accessibilityPreferences: z.array(z.nativeEnum(AccessibilityFeature)).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
