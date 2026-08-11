"use server";

import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations/auth";
import { signIn } from "@/auth";

export interface LoginFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const callbackUrl = String(formData.get("callbackUrl") ?? "/post-login");

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl || "/post-login",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { error: "Incorrect email or password." };
      }
      return { error: err.cause?.err?.message ?? "Unable to sign in right now." };
    }
    throw err;
  }

  return {};
}
