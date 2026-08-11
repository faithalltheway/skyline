"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction, type OnboardingState } from "./actions";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { TextField } from "@/components/ui/Field";
import { CheckboxCard } from "@/components/ui/CheckboxCard";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Card } from "@/components/ui/Card";
import { useAnnounce } from "@/components/ui/LiveRegion";
import {
  ACCESSIBILITY_CATEGORIES,
  ACCESSIBILITY_CATEGORY_LABELS,
  ACCESSIBILITY_FEATURE_META,
  featuresByCategory,
} from "@/lib/accessibility";
import { Interest } from "@prisma/client";

const STEPS = ["Basic info", "Interests", "Accessibility", "Review"];

const INTEREST_LABELS: Record<Interest, string> = {
  MUSIC: "Music",
  SPORTS: "Sports",
  FOOD: "Food",
  ARTS: "Arts",
  COMMUNITY: "Community",
  GAMING: "Gaming",
  OUTDOORS: "Outdoors",
  EDUCATION: "Education",
  NIGHTLIFE: "Nightlife",
  FAMILY: "Family",
  OTHER: "Other",
};

const initialState: OnboardingState = {};

export function OnboardingWizard({
  defaultUsername,
  defaultCity,
  defaultState,
  defaultZip,
}: {
  defaultUsername: string;
  defaultCity: string;
  defaultState: string;
  defaultZip: string;
}) {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [prefs, setPrefs] = useState<string[]>([]);
  const announce = useAnnounce();
  const grouped = featuresByCategory();

  function goTo(next: number) {
    setStep(next);
    announce(`Step ${next + 1} of ${STEPS.length}: ${STEPS[next]}`);
  }

  function toggleInterest(i: Interest) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function togglePref(f: string) {
    setPrefs((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

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
          <h2 className="text-xl font-bold">Tell us about you</h2>
          <TextField
            label="Username"
            name="username"
            defaultValue={defaultUsername}
            required={step === 0}
            hint="Lowercase letters, numbers, and hyphens."
            error={state.fieldErrors?.username}
          />
          <ImageUpload name="avatarUrl" label="Profile photo (optional)" folder="avatars" aspect="square" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <TextField label="City" name="city" defaultValue={defaultCity} required={step === 0} error={state.fieldErrors?.city} />
            <TextField label="State" name="state" maxLength={2} defaultValue={defaultState} required={step === 0} error={state.fieldErrors?.state} />
            <TextField label="ZIP code" name="zip" defaultValue={defaultZip} required={step === 0} error={state.fieldErrors?.zip} />
          </div>
        </div>

        <div hidden={step !== 1} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">What are you into?</h2>
          <p className="text-sm text-neutral-500">Pick as many as you like — this helps us recommend events.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(INTEREST_LABELS).map(([value, label]) => (
              <CheckboxCard
                key={value}
                id={`interest-${value}`}
                label={label}
                checked={interests.includes(value as Interest)}
                onChange={() => toggleInterest(value as Interest)}
              />
            ))}
          </div>
          {interests.map((i) => (
            <input key={i} type="hidden" name="interests" value={i} />
          ))}
        </div>

        <div hidden={step !== 2} className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold">Your accessibility needs</h2>
            <p className="text-sm text-neutral-500">
              We&apos;ll use this to show a match score on every event. You can update these anytime from your
              profile.
            </p>
          </div>
          {ACCESSIBILITY_CATEGORIES.map((category) => (
            <fieldset key={category}>
              <legend className="mb-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                {ACCESSIBILITY_CATEGORY_LABELS[category]}
              </legend>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {grouped[category].map((feature) => (
                  <CheckboxCard
                    key={feature}
                    id={`pref-${feature}`}
                    label={ACCESSIBILITY_FEATURE_META[feature].label}
                    checked={prefs.includes(feature)}
                    onChange={() => togglePref(feature)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
          {prefs.map((p) => (
            <input key={p} type="hidden" name="accessibilityPreferences" value={p} />
          ))}
        </div>

        <div hidden={step !== 3} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Review</h2>
          <p className="text-sm text-neutral-500">
            You selected {interests.length} interest{interests.length === 1 ? "" : "s"} and {prefs.length}{" "}
            accessibility preference{prefs.length === 1 ? "" : "s"}. You can change these later from your profile.
          </p>
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
              {pending ? "Saving…" : "Finish setup"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
