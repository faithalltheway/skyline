"use server";

import { redirect } from "next/navigation";
import { requireOrganization } from "@/lib/authz";
import { partnerEventFormSchema, parseAccessibilityAnswers } from "@/lib/validations/event";
import { createEvent, updateEvent } from "@/services/eventCreationService";
import { revalidatePath } from "next/cache";

export interface PartnerEventState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function extractRaw(formData: FormData) {
  return {
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
}

export async function createPartnerEventAction(
  _prevState: PartnerEventState,
  formData: FormData,
): Promise<PartnerEventState> {
  const { user, organization } = await requireOrganization();

  const raw = extractRaw(formData);
  const parsed = partnerEventFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  if (formData.get("accessibilityConfirmed") !== "true") {
    return { error: "Confirm you've completed the accessibility questionnaire before submitting." };
  }

  const images = [raw.coverImageUrl, formData.get("image2"), formData.get("image3")]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  const accessibilityAnswers = parseAccessibilityAnswers(formData);

  const eventId = String(formData.get("eventId") ?? "");
  let slug: string;
  if (eventId) {
    const event = await updateEvent(eventId, { ...parsed.data, images, accessibilityAnswers }, user.id, "PENDING_REVIEW");
    slug = event.slug;
  } else {
    const event = await createEvent(
      { ...parsed.data, images, accessibilityAnswers },
      { userId: user.id, organizationId: organization.id },
      "PENDING_REVIEW",
    );
    slug = event.slug;
  }

  revalidatePath("/partner/events");
  redirect(`/partner/events?submitted=${slug}`);
}
