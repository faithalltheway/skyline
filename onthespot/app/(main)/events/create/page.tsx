import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { CreateEventWizard } from "./CreateEventWizard";

export const metadata = { title: "Create an event" };

export default async function CreateEventPage() {
  await requireUser();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold">Create a community event</h1>
      <p className="mt-1 text-neutral-500">
        Host a meetup, gathering, or activity. All community events are reviewed before they go live.
      </p>
      <div className="mt-6">
        <CreateEventWizard categories={categories} />
      </div>
    </div>
  );
}
