import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

/** Requires any authenticated, active session. Redirects to /login otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === "BANNED" || session.user.status === "SUSPENDED") {
    redirect("/account-suspended");
  }
  return session.user;
}

/** Requires the session user to hold one of the given roles server-side. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/**
 * Resolves the partner organization the current user manages, or redirects.
 * Membership (not the JWT role claim, which can lag a fresh role upgrade
 * until re-login) is the authoritative check here.
 */
export async function requireOrganization() {
  const user = await requireUser();
  const membership = await db.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) redirect("/partner/onboarding");
  return { user, organization: membership.organization, member: membership };
}
