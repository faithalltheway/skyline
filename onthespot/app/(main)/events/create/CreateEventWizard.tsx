"use client";

import { useActionState, useEffect, useState } from "react";
import { createCommunityEventAction, type CreateEventState } from "./actions";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { CheckboxCard } from "@/components/ui/CheckboxCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { LocationFields } from "@/components/events/LocationFields";
import { AccessibilityQuestionnaire } from "@/components/events/AccessibilityQuestionnaire";
import { useAnnounce } from "@/components/ui/LiveRegion";

const STEPS = ["Basic info", "Date & time", "Location", "Accessibility", "Photos", "Review"];

// Which step each server-validated field lives on, so a failed submission
// can jump the wizard back to whatever step actually has the error instead
// of leaving the user stuck on Review with no visible feedback.
const FIELD_STEP: Record<string, number> = {
  title: 0,
  description: 0,
  categories: 0,
  startAt: 1,
  endAt: 1,
  venueName: 2,
  addressLine1: 2,
  city: 2,
  state: 2,
  zip: 2,
  latitude: 2,
  longitude: 2,
  accessibilityContactName: 3,
  accessibilityContactEmail: 3,
  accessibilityContactPhone: 3,
};

const initialState: CreateEventState = {};

export function CreateEventWizard({ categories }: { categories: { slug: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createCommunityEventAction, initialState);
  const [step, setStep] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const announce = useAnnounce();

  function goTo(next: number) {
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
    announce(`Step ${next + 1} of ${STEPS.length}: ${STEPS[next]}`);
  }

  // Jump back to whichever step has the error after a failed submission —
  // adjusted during render (React's recommended pattern for state derived
  // from a changed prop/value) rather than in an effect, so the erroring
  // step is already visible on the very first paint after the failed
  // submit instead of flashing the Review step first.
  const [handledErrorState, setHandledErrorState] = useState(state);
  if (state !== handledErrorState) {
    setHandledErrorState(state);
    const fields = state.fieldErrors ? Object.keys(state.fieldErrors) : [];
    if (fields.length > 0) {
      setStep(Math.min(...fields.map((f) => FIELD_STEP[f] ?? STEPS.length - 1)));
    }
  }

  useEffect(() => {
    const fields = state.fieldErrors ? Object.keys(state.fieldErrors) : [];
    if (fields.length === 0) return;
    const earliestStep = Math.min(...fields.map((f) => FIELD_STEP[f] ?? STEPS.length - 1));
    announce(`There's a problem with ${STEPS[earliestStep]} — see the highlighted field.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Card className="p-6 sm:p-8">
      <ProgressSteps steps={STEPS} currentStep={step} />
      <form action={formAction} className="mt-8 flex flex-col gap-6" noValidate>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
            {state.error}
          </p>
        )}

        <div hidden={step !== 0} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Tell us about your event</h2>
          <TextField label="Event title" name="title" required={step === 0} error={state.fieldErrors?.title} />
          <TextAreaField
            label="Description"
            name="description"
            rows={5}
            required={step === 0}
            error={state.fieldErrors?.description}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Categories</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => (
                <CheckboxCard key={c.slug} id={`cat-${c.slug}`} name="categories" value={c.slug} label={c.name} />
              ))}
            </div>
            {state.fieldErrors?.categories && (
              <p role="alert" className="mt-1 text-xs font-medium text-[var(--color-unavailable)]">
                {state.fieldErrors.categories}
              </p>
            )}
          </fieldset>
        </div>

        <div hidden={step !== 1} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Date &amp; time</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Starts" name="startAt" type="datetime-local" required={step === 1} error={state.fieldErrors?.startAt} />
            <TextField label="Ends" name="endAt" type="datetime-local" required={step === 1} error={state.fieldErrors?.endAt} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            This is a recurring event
          </label>
          <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />
          {isRecurring && (
            <TextField
              label="Recurrence"
              name="recurrenceRule"
              placeholder="e.g. Every Saturday"
              hint="Plain-language description of the recurrence pattern."
            />
          )}
        </div>

        <div hidden={step !== 2} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Where is it happening?</h2>
          <LocationFields required={step === 2} errors={state.fieldErrors} />
        </div>

        <div hidden={step !== 3} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Accessibility information</h2>
          <AccessibilityQuestionnaire />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Accessibility contact name" name="accessibilityContactName" error={state.fieldErrors?.accessibilityContactName} />
            <TextField label="Accessibility contact email" name="accessibilityContactEmail" type="email" error={state.fieldErrors?.accessibilityContactEmail} />
            <TextField label="Accessibility contact phone" name="accessibilityContactPhone" type="tel" error={state.fieldErrors?.accessibilityContactPhone} />
          </div>
        </div>

        <div hidden={step !== 4} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Photos</h2>
          <ImageUpload name="coverImageUrl" label="Cover photo" folder="events" aspect="wide" />
          <ImageUpload name="image2" label="Additional photo (optional)" folder="events" aspect="wide" />
          <ImageUpload name="image3" label="Additional photo (optional)" folder="events" aspect="wide" />
        </div>

        <div hidden={step !== 5} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Review &amp; submit</h2>
          <p className="text-sm text-neutral-500">
            Your event will be submitted to OnTheSpot&apos;s moderation team for review before it appears publicly.
            You&apos;ll be notified once it&apos;s approved.
          </p>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="radio" name="isFree" value="true" checked={isFree} onChange={() => setIsFree(true)} />
            This event is free
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="radio" name="isFree" value="false" checked={!isFree} onChange={() => setIsFree(false)} />
            This event has a cost
          </label>
          {!isFree && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Price (USD)" name="price" type="number" step="0.01" min={0} />
              <TextField label="Ticket link" name="ticketUrl" type="url" />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Minimum age (optional)" name="minAge" type="number" min={0} />
            <TextField label="Maximum age (optional)" name="maxAge" type="number" min={0} />
          </div>
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
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit for review"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
