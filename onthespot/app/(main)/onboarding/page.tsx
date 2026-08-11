import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await db.userProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <OnboardingWizard
        defaultUsername={profile?.username ?? ""}
        defaultCity={profile?.city ?? ""}
        defaultState={profile?.state ?? ""}
        defaultZip={profile?.zip ?? ""}
      />
    </div>
  );
}
