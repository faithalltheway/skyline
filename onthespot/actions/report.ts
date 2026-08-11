"use server";

import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { reportEventSchema } from "@/lib/validations/report";

export interface ReportFormState {
  success?: boolean;
  error?: string;
}

export async function reportEventAction(
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const user = await requireUser();

  const parsed = reportEventSchema.safeParse({
    eventId: formData.get("eventId"),
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please choose a reason for your report." };
  }

  await db.report.create({
    data: {
      reporterId: user.id,
      eventId: parsed.data.eventId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  return { success: true };
}
