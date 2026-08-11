import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
