import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Become a partner" };

export default async function PartnerOnboardingPage() {
  const user = await requireUser();
  const existing = await db.organizationMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/partner");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-8">
        <h1 className="text-2xl font-extrabold">Set up your organization</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create an organization profile to start hosting and publishing events on OnTheSpot.
        </p>
        <div className="mt-6">
          <OnboardingForm defaultEmail={user.email} />
        </div>
      </Card>
    </div>
  );
}
