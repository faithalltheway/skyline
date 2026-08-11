"use server";

import { db } from "@/lib/db";

export async function verifyEmailToken(token: string): Promise<{ success: boolean; message: string }> {
  const record = await db.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { success: false, message: "This verification link is invalid or has expired." };
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    db.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { success: true, message: "Your email has been verified." };
}
