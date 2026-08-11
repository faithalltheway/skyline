import "server-only";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { RegisterInput } from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

async function uniqueUsername(base: string): Promise<string> {
  const root = slugify(base) || "user";
  let candidate = root;
  let n = 1;
  while (await db.userProfile.findUnique({ where: { username: candidate } })) {
    n += 1;
    candidate = `${root}${n}`;
  }
  return candidate;
}

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "organization";
  let candidate = root;
  let n = 1;
  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export async function registerUser(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const role = input.accountType === "PARTNER" ? "PARTNER" : "USER";

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role,
      profile: {
        create: {
          username: await uniqueUsername(input.name),
        },
      },
      subscription: {
        create: { tier: "FREE", status: "ACTIVE" },
      },
    },
  });

  if (input.accountType === "PARTNER" && input.organizationName) {
    const organization = await db.organization.create({
      data: {
        name: input.organizationName,
        slug: await uniqueOrgSlug(input.organizationName),
        contactEmail: input.email,
        verificationStatus: "UNVERIFIED",
        subscription: { create: { tier: "FREE", status: "ACTIVE" } },
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ORGANIZATION_CREATED",
        entityType: "ORGANIZATION",
        entityId: organization.id,
      },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
      metadata: { role },
    },
  });

  return user;
}
