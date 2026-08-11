"use client";

import { useActionState, useState } from "react";
import { createPartnerEventAction, type PartnerEventState } from "@/app/partner/events/new/actions";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { CheckboxCard } from "@/components/ui/CheckboxCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { LocationFields } from "@/components/events/LocationFields";
import { AccessibilityQuestionnaire } from "@/components/events/AccessibilityQuestionnaire";
import type { AccessibilityFeature, AccessibilityState } from "@prisma/client";

const STEPS = ["Basic", "Date & time", "Location", "Pricing", "Accessibility", "Photos", "Review"];

const initialState: PartnerEventState = {};

export interface PartnerEventDefaults {
  eventId?: string;
  title?: string;
  description?: string;
  categories?: string[];
  startAt?: string;
  endAt?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  venueName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  indoorOutdoor?: string;
  isFree?: boolean;
  price?: number;
  ticketUrl?: string;
  minAge?: number;
  maxAge?: number;
  coverImageUrl?: string;
  accessibilityContactName?: string;
  accessibilityContactEmail?: string;
  accessibilityContactPhone?: string;
  accessibilityAnswers?: { feature: AccessibilityFeature; state: AccessibilityState; note?: string | null }[];
}

export function PartnerEventWizard({
  categories,
  defaults,
}: {
  categories: { slug: string; name: string }[];
  defaults?: PartnerEventDefaults;
}) {
  const [state, formAction, pending] = useActionState(createPartnerEventAction, initialState);
  const [step, setStep] = useState(0);
  const [isFree, setIsFree] = useState(defaults?.isFree ?? true);
  const [isRecurring, setIsRecurring] = useState(defaults?.isRecurring ?? false);
  const [confirmed, setConfirmed] = useState(false);

  function goTo(next: number) {
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
  }

  return (
    <Card className="p-6 sm:p-8">
      <ProgressSteps steps={STEPS} currentStep={step} />
      <form action={formAction} className="mt-8 flex flex-col gap-6" noValidate>
        {defaults?.eventId && <input type="hidden" name="eventId" value={defaults.eventId} />}
        {state.error && (
          <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
            {state.error}
          </p>
        )}

        <div hidden={step !== 0} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Basic information</h2>
          <TextField label="Event title" name="title" defaultValue={defaults?.title} required={step === 0} error={state.fieldErrors?.title} />
          <TextAreaField label="Description" name="description" defaultValue={defaults?.description} rows={5} required={step === 0} error={state.fieldErrors?.description} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Categories</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => (
                <CheckboxCard
                  key={c.slug}
                  id={`cat-${c.slug}`}
                  name="categories"
                  value={c.slug}
                  label={c.name}
                  defaultChecked={defaults?.categories?.includes(c.slug)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div hidden={step !== 1} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Date &amp; time</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Starts" name="startAt" type="datetime-local" defaultValue={defaults?.startAt} required={step === 1} error={state.fieldErrors?.startAt} />
            <TextField label="Ends" name="endAt" type="datetime-local" defaultValue={defaults?.endAt} required={step === 1} error={state.fieldErrors?.endAt} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            This is a recurring event
          </label>
          <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />
          {isRecurring && (
            <TextField label="Recurrence" name="recurrenceRule" defaultValue={defaults?.recurrenceRule} placeholder="e.g. Every Saturday" />
          )}
        </div>

        <div hidden={step !== 2} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Location</h2>
          <LocationFields defaultValues={defaults} />
        </div>

        <div hidden={step !== 3} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Pricing</h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="radio" name="isFree" value="true" checked={isFree} onChange={() => setIsFree(true)} />
            Free event
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="radio" name="isFree" value="false" checked={!isFree} onChange={() => setIsFree(false)} />
            Paid event
          </label>
          {!isFree && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Price (USD)" name="price" type="number" step="0.01" min={0} defaultValue={defaults?.price} />
              <TextField label="Ticket link" name="ticketUrl" type="url" defaultValue={defaults?.ticketUrl} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Minimum age (optional)" name="minAge" type="number" min={0} defaultValue={defaults?.minAge} />
            <TextField label="Maximum age (optional)" name="maxAge" type="number" min={0} defaultValue={defaults?.maxAge} />
          </div>
        </div>

        <div hidden={step !== 4} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Accessibility questionnaire</h2>
          <p className="text-sm text-neutral-500">
            Required for every organization listing — attendees rely on this to decide whether an event works for
            them.
          </p>
          <AccessibilityQuestionnaire defaultAnswers={defaults?.accessibilityAnswers} />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Accessibility contact name"
              name="accessibilityContactName"
              defaultValue={defaults?.accessibilityContactName}
              required
              error={state.fieldErrors?.accessibilityContactName}
            />
            <TextField
              label="Accessibility contact email"
              name="accessibilityContactEmail"
              type="email"
              defaultValue={defaults?.accessibilityContactEmail}
              required
              error={state.fieldErrors?.accessibilityContactEmail}
            />
            <TextField
              label="Accessibility contact phone"
              name="accessibilityContactPhone"
              type="tel"
              defaultValue={defaults?.accessibilityContactPhone}
            />
          </div>
        </div>

        <div hidden={step !== 5} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Photos</h2>
          <ImageUpload name="coverImageUrl" label="Cover photo" folder="events" defaultValue={defaults?.coverImageUrl} aspect="wide" />
          <ImageUpload name="image2" label="Additional photo (optional)" folder="events" aspect="wide" />
          <ImageUpload name="image3" label="Additional photo (optional)" folder="events" aspect="wide" />
        </div>

        <div hidden={step !== 6} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Review &amp; submit</h2>
          <p className="text-sm text-neutral-500">
            Your listing will be submitted for OnTheSpot moderation. Once approved, you can publish it from your
            events dashboard.
          </p>
          <label className="flex items-start gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="accessibilityConfirmed"
              value="true"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
              required
            />
            I confirm the accessibility questionnaire reflects the actual conditions at this venue.
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => goTo(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={pending || !confirmed}>
              {pending ? "Submitting…" : "Submit for review"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
