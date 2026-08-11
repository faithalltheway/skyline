"use server";

import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateToken, PASSWORD_RESET_TTL_MS } from "@/lib/tokens";

export interface ForgotPasswordState {
  submitted?: boolean;
  error?: string;
  /** Only ever populated outside production — there is no email provider wired up in this MVP. */
  devResetUrl?: string;
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  let devResetUrl: string | undefined;
  if (user) {
    const token = generateToken();
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    if (process.env.NODE_ENV !== "production") {
      devResetUrl = url;
    }
    // In production this would be sent via a transactional email provider instead of returned to the client.
  }

  return { submitted: true, devResetUrl };
}
