"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { eventFormSchema, parseAccessibilityAnswers } from "@/lib/validations/event";
import { createEvent } from "@/services/eventCreationService";

export interface CreateEventState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createCommunityEventAction(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const user = await requireUser();

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    categories: formData.getAll("categories").map(String),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: String(formData.get("endAt") ?? ""),
    isRecurring: formData.get("isRecurring") === "true",
    recurrenceRule: String(formData.get("recurrenceRule") ?? ""),
    venueName: String(formData.get("venueName") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    zip: String(formData.get("zip") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
    indoorOutdoor: String(formData.get("indoorOutdoor") ?? "INDOOR"),
    isFree: formData.get("isFree") === "true",
    price: String(formData.get("price") ?? ""),
    ticketUrl: String(formData.get("ticketUrl") ?? ""),
    minAge: String(formData.get("minAge") ?? ""),
    maxAge: String(formData.get("maxAge") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    accessibilityContactName: String(formData.get("accessibilityContactName") ?? ""),
    accessibilityContactEmail: String(formData.get("accessibilityContactEmail") ?? ""),
    accessibilityContactPhone: String(formData.get("accessibilityContactPhone") ?? ""),
  };

  const parsed = eventFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const images = [raw.coverImageUrl, formData.get("image2"), formData.get("image3")]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  const accessibilityAnswers = parseAccessibilityAnswers(formData);

  const event = await createEvent(
    { ...parsed.data, images, accessibilityAnswers },
    { userId: user.id },
    "PENDING_REVIEW",
  );

  redirect(`/events/create/submitted?slug=${event.slug}`);
}
