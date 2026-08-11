import { z } from "zod";
import { AccessibilityFeature, AccessibilityState, IndoorOutdoor } from "@prisma/client";

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(140),
    description: z.string().trim().min(20, "Add at least a short description (20+ characters)").max(5000),
    categories: z.array(z.string()).min(1, "Choose at least one category"),
    startAt: z.string().min(1, "Start date/time is required"),
    endAt: z.string().min(1, "End date/time is required"),
    isRecurring: z.coerce.boolean().default(false),
    recurrenceRule: z.string().optional(),
    venueName: z.string().trim().min(1, "Venue name is required").max(140),
    addressLine1: z.string().trim().min(1, "Address is required").max(200),
    city: z.string().trim().min(1, "City is required").max(80),
    state: z.string().trim().min(2).max(2),
    zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    indoorOutdoor: z.nativeEnum(IndoorOutdoor),
    isFree: z.coerce.boolean(),
    price: z.coerce.number().min(0).optional(),
    ticketUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
    minAge: z.coerce.number().min(0).max(120).optional(),
    maxAge: z.coerce.number().min(0).max(120).optional(),
    coverImageUrl: z.string().optional().or(z.literal("")),
    accessibilityContactName: z.string().trim().max(120).optional().or(z.literal("")),
    accessibilityContactEmail: z.string().trim().email().optional().or(z.literal("")),
    accessibilityContactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End time must be after the start time",
    path: ["endAt"],
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;

// Partners must provide accessibility contact details — accessibility
// information can't be published as an afterthought.
export const partnerEventFormSchema = eventFormSchema.and(
  z.object({
    accessibilityContactName: z.string().trim().min(1, "Required for organization listings"),
    accessibilityContactEmail: z.string().trim().email("Enter a valid email"),
  }),
);

export const accessibilityAnswerSchema = z.object({
  feature: z.nativeEnum(AccessibilityFeature),
  state: z.nativeEnum(AccessibilityState),
  note: z.string().trim().max(280).optional(),
});

export function parseAccessibilityAnswers(formData: FormData) {
  const answers: { feature: AccessibilityFeature; state: AccessibilityState; note?: string }[] = [];
  for (const feature of Object.values(AccessibilityFeature)) {
    const state = formData.get(`accessibility.${feature}.state`);
    if (!state) continue;
    const note = formData.get(`accessibility.${feature}.note`);
    const parsed = accessibilityAnswerSchema.safeParse({
      feature,
      state,
      note: note ? String(note) : undefined,
    });
    if (parsed.success) answers.push(parsed.data);
  }
  return answers;
}
