"use client";

import { verifyOrgAction, rejectOrgVerificationAction, suspendOrgAction, restoreOrgAction } from "./actions";
import { ReasonActionForm } from "@/components/admin/ReasonActionForm";
import type { OrgVerificationStatus } from "@prisma/client";

export function PartnerRowActions({
  organizationId,
  verificationStatus,
  suspended,
}: {
  organizationId: string;
  verificationStatus: OrgVerificationStatus;
  suspended: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {verificationStatus !== "VERIFIED" && (
        <ReasonActionForm action={verifyOrgAction} hiddenFields={{ organizationId }} label="Verify" variant="primary" confirmLabel="Verify organization" />
      )}
      {verificationStatus === "PENDING" && (
        <ReasonActionForm action={rejectOrgVerificationAction} hiddenFields={{ organizationId }} label="Reject verification" variant="outline" confirmLabel="Reject verification" />
      )}
      {!suspended ? (
        <ReasonActionForm action={suspendOrgAction} hiddenFields={{ organizationId }} label="Suspend" variant="danger" confirmLabel="Suspend organization" />
      ) : (
        <ReasonActionForm action={restoreOrgAction} hiddenFields={{ organizationId }} label="Restore" variant="outline" confirmLabel="Restore organization" />
      )}
    </div>
  );
}
