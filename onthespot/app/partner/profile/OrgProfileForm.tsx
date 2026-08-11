"use client";

import { useActionState } from "react";
import { updateOrganizationProfileAction, type OrgProfileState } from "./actions";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Organization } from "@prisma/client";

const initialState: OrgProfileState = {};

export function OrgProfileForm({ organization }: { organization: Organization }) {
  const [state, formAction, pending] = useActionState(updateOrganizationProfileAction, initialState);
  const social = (organization.socialLinks as { facebook?: string; instagram?: string } | null) ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.success && (
        <p role="status" className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          Organization profile updated.
        </p>
      )}
      <ImageUpload name="logoUrl" label="Logo" folder="organizations" defaultValue={organization.logoUrl} aspect="square" />
      <TextField label="Organization name" name="name" defaultValue={organization.name} required error={state.fieldErrors?.name} />
      <TextAreaField label="Description" name="description" defaultValue={organization.description ?? ""} rows={4} />
      <TextField label="Website" name="website" type="url" defaultValue={organization.website ?? ""} error={state.fieldErrors?.website} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Contact email" name="contactEmail" type="email" defaultValue={organization.contactEmail} required error={state.fieldErrors?.contactEmail} />
        <TextField label="Contact phone" name="contactPhone" type="tel" defaultValue={organization.contactPhone ?? ""} />
      </div>
      <TextField label="Address" name="addressLine1" defaultValue={organization.addressLine1 ?? ""} />
      <div className="grid grid-cols-3 gap-4">
        <TextField label="City" name="city" defaultValue={organization.city ?? ""} />
        <TextField label="State" name="state" maxLength={2} defaultValue={organization.state ?? ""} />
        <TextField label="ZIP" name="zip" defaultValue={organization.zip ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Facebook (optional)" name="facebook" defaultValue={social.facebook ?? ""} />
        <TextField label="Instagram (optional)" name="instagram" defaultValue={social.instagram ?? ""} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
