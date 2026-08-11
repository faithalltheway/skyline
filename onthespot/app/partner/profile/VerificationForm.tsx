"use client";

import { useActionState } from "react";
import { submitVerificationAction, type VerificationState } from "./actions";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Badge } from "@/components/ui/Badge";
import type { OrgVerificationStatus, OrganizationVerification } from "@prisma/client";

const initialState: VerificationState = {};

export function VerificationForm({
  status,
  verification,
}: {
  status: OrgVerificationStatus;
  verification: OrganizationVerification | null;
}) {
  const [state, formAction, pending] = useActionState(submitVerificationAction, initialState);

  if (status === "VERIFIED") {
    return (
      <Badge tone="confirmed" className="text-sm">
        Verified organization
      </Badge>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Badge tone={status === "PENDING" ? "unknown" : status === "REJECTED" ? "unavailable" : "neutral"}>
        {status === "PENDING" ? "Verification pending review" : status === "REJECTED" ? "Verification rejected — resubmit below" : "Not yet verified"}
      </Badge>
      {state.success && (
        <p role="status" className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          Verification submitted for review.
        </p>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
            {state.error}
          </p>
        )}
        <TextField label="Legal organization name" name="legalName" defaultValue={verification?.legalName ?? ""} required />
        <TextField label="Tax ID / EIN (optional)" name="taxId" defaultValue={verification?.taxId ?? ""} />
        <ImageUpload name="documentUrl" label="Verification document (optional)" folder="verification" aspect="wide" defaultValue={verification?.documentUrl} />
        <TextAreaField label="Notes for reviewers (optional)" name="notes" defaultValue={verification?.notes ?? ""} rows={3} />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Submitting…" : "Submit for verification"}
        </Button>
      </form>
    </div>
  );
}
