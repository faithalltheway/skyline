"use server";

import { registerSchema } from "@/lib/validations/auth";
import { registerUser } from "@/services/userService";
import { signIn } from "@/auth";

export interface RegisterFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    accountType: String(formData.get("accountType") ?? "USER"),
    organizationName: String(formData.get("organizationName") ?? "") || undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await registerUser(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/onboarding",
  });

  return {};
}
