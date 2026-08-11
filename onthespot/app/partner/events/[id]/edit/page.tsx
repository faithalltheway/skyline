import { notFound } from "next/navigation";
import { requireOrganization } from "@/lib/authz";
import { db } from "@/lib/db";
import { toDateTimeLocalValue } from "@/lib/utils";
import { PartnerEventWizard } from "@/components/events/PartnerEventWizard";

export const metadata = { title: "Edit event" };

export default async function EditPartnerEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireOrganization();

  const [event, categories] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: { categories: { include: { category: true } }, accessibility: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!event || event.organizationId !== organization.id) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Edit event</h1>
        <p className="text-sm text-neutral-500">Changes are re-submitted for moderation review.</p>
      </div>
      <PartnerEventWizard
        categories={categories}
        defaults={{
          eventId: event.id,
          title: event.title,
          description: event.description,
          categories: event.categories.map((c) => c.category.slug),
          startAt: toDateTimeLocalValue(event.startAt),
          endAt: toDateTimeLocalValue(event.endAt),
          isRecurring: event.isRecurring,
          recurrenceRule: event.recurrenceRule ?? undefined,
          venueName: event.venueName,
          addressLine1: event.addressLine1,
          city: event.city,
          state: event.state,
          zip: event.zip,
          latitude: event.latitude,
          longitude: event.longitude,
          indoorOutdoor: event.indoorOutdoor,
          isFree: event.isFree,
          price: event.price ? Number(event.price) : undefined,
          ticketUrl: event.ticketUrl ?? undefined,
          minAge: event.minAge ?? undefined,
          maxAge: event.maxAge ?? undefined,
          coverImageUrl: event.coverImageUrl ?? undefined,
          accessibilityContactName: event.accessibilityContactName ?? undefined,
          accessibilityContactEmail: event.accessibilityContactEmail ?? undefined,
          accessibilityContactPhone: event.accessibilityContactPhone ?? undefined,
          accessibilityAnswers: event.accessibility.map((a) => ({ feature: a.feature, state: a.state, note: a.note })),
        }}
      />
    </div>
  );
}
