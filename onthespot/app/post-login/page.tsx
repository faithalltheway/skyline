import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function PostLoginPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, status, id } = session.user;

  if (status === "BANNED" || status === "SUSPENDED") redirect("/account-suspended");
  if (role === "ADMIN") redirect("/admin");
  if (role === "PARTNER") redirect("/partner");

  const profile = await db.userProfile.findUnique({ where: { userId: id } });
  if (!profile?.onboardedAt) redirect("/onboarding");

  redirect("/discover");
}
