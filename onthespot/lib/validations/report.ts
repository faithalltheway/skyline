import { z } from "zod";
import { ReportReason } from "@prisma/client";

export const reportEventSchema = z.object({
  eventId: z.string().min(1),
  reason: z.nativeEnum(ReportReason),
  details: z.string().trim().max(1000).optional(),
});
