"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  organizationName: z.string().trim().min(2, "Organization name is required").max(120),
  contactEmail: z.string().trim().email("Enter a valid email"),
});

export interface PartnerOnboardingState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createOrganizationAction(
  _prevState: PartnerOnboardingState,
  formData: FormData,
): Promise<PartnerOnboardingState> {
  const user = await requireUser();

  const existing = await db.organizationMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/partner");

  const parsed = schema.safeParse({
    organizationName: formData.get("organizationName"),
    contactEmail: formData.get("contactEmail"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const root = slugify(parsed.data.organizationName) || "organization";
  let slug = root;
  let n = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }

  await db.$transaction([
    db.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug,
        contactEmail: parsed.data.contactEmail,
        members: { create: { userId: user.id, role: "OWNER" } },
        subscription: { create: { tier: "FREE", status: "ACTIVE" } },
      },
    }),
    db.user.update({ where: { id: user.id }, data: { role: "PARTNER" } }),
  ]);

  redirect("/partner");
}
