"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { AccessibilityFeature, Interest } from "@prisma/client";

export interface ProfileFormState {
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const raw = {
    username: String(formData.get("username") ?? ""),
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    zip: String(formData.get("zip") ?? ""),
    interests: formData.getAll("interests").map(String) as Interest[],
    accessibilityPreferences: formData.getAll("accessibilityPreferences").map(String) as AccessibilityFeature[],
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const existingUsername = await db.userProfile.findFirst({
    where: { username: parsed.data.username, userId: { not: user.id } },
  });
  if (existingUsername) {
    return { fieldErrors: { username: "That username is already taken." } };
  }

  await db.$transaction([
    db.userProfile.update({
      where: { userId: user.id },
      data: {
        username: parsed.data.username,
        avatarUrl: parsed.data.avatarUrl || null,
        city: parsed.data.city,
        state: parsed.data.state.toUpperCase(),
        zip: parsed.data.zip,
        interests: parsed.data.interests,
      },
    }),
    db.accessibilityPreference.deleteMany({ where: { userId: user.id } }),
    ...(parsed.data.accessibilityPreferences.length
      ? [
          db.accessibilityPreference.createMany({
            data: parsed.data.accessibilityPreferences.map((feature) => ({ userId: user.id, feature })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/profile");
  return { success: true };
}

export interface MonetizationFormState {
  success?: boolean;
  error?: string;
}

function parseOptionalDollars(raw: FormDataEntryValue | null): number | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const dollars = Number(trimmed);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

export async function updateMonetizationSettingsAction(
  _prevState: MonetizationFormState,
  formData: FormData,
): Promise<MonetizationFormState> {
  const user = await requireUser();

  const messagePriceCents = parseOptionalDollars(formData.get("messagePrice"));
  const followPriceCents = parseOptionalDollars(formData.get("followPrice"));

  await db.userProfile.update({
    where: { userId: user.id },
    data: { messagePriceCents, followPriceCents },
  });

  revalidatePath("/profile");
  return { success: true };
}
