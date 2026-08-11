import { requireOrganization } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { OrgProfileForm } from "./OrgProfileForm";
import { VerificationForm } from "./VerificationForm";

export const metadata = { title: "Organization profile" };

export default async function PartnerProfilePage() {
  const { organization } = await requireOrganization();
  const verification = await db.organizationVerification.findUnique({ where: { organizationId: organization.id } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Organization profile</h1>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">Verification</h2>
        <VerificationForm status={organization.verificationStatus} verification={verification} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold">Profile details</h2>
        <OrgProfileForm organization={organization} />
      </Card>
    </div>
  );
}
