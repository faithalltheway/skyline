import { requireOrganization } from "@/lib/authz";
import { db } from "@/lib/db";
import { PartnerEventWizard } from "@/components/events/PartnerEventWizard";

export const metadata = { title: "Create event" };

export default async function NewPartnerEventPage() {
  await requireOrganization();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Create an event</h1>
        <p className="text-sm text-neutral-500">Build a fully accessible listing in a few steps.</p>
      </div>
      <PartnerEventWizard categories={categories} />
    </div>
  );
}
