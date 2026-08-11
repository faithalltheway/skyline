"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/authz";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  zip: z.string().trim().max(10).optional().or(z.literal("")),
  facebook: z.string().trim().max(200).optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
});

export interface OrgProfileState {
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

export async function updateOrganizationProfileAction(
  _prevState: OrgProfileState,
  formData: FormData,
): Promise<OrgProfileState> {
  const { organization } = await requireOrganization();

  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const { facebook, instagram, ...rest } = parsed.data;

  await db.organization.update({
    where: { id: organization.id },
    data: {
      ...rest,
      logoUrl: rest.logoUrl || null,
      website: rest.website || null,
      socialLinks: { facebook: facebook || undefined, instagram: instagram || undefined },
    },
  });

  revalidatePath("/partner/profile");
  return { success: true };
}

const verificationSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  taxId: z.string().trim().max(40).optional().or(z.literal("")),
  documentUrl: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export interface VerificationState {
  success?: boolean;
  error?: string;
}

export async function submitVerificationAction(
  _prevState: VerificationState,
  formData: FormData,
): Promise<VerificationState> {
  const { organization } = await requireOrganization();

  const parsed = verificationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Please complete all required fields." };

  await db.$transaction([
    db.organizationVerification.upsert({
      where: { organizationId: organization.id },
      update: { ...parsed.data, status: "PENDING", submittedAt: new Date(), reviewedAt: null },
      create: { organizationId: organization.id, ...parsed.data, status: "PENDING" },
    }),
    db.organization.update({ where: { id: organization.id }, data: { verificationStatus: "PENDING" } }),
  ]);

  revalidatePath("/partner/profile");
  return { success: true };
}
