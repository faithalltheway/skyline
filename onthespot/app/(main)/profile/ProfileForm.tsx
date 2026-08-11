"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ProfileFormState } from "./actions";
import { TextField } from "@/components/ui/Field";
import { CheckboxCard } from "@/components/ui/CheckboxCard";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useAnnounce } from "@/components/ui/LiveRegion";
import {
  ACCESSIBILITY_CATEGORIES,
  ACCESSIBILITY_CATEGORY_LABELS,
  ACCESSIBILITY_FEATURE_META,
  featuresByCategory,
} from "@/lib/accessibility";
import { Interest, type AccessibilityFeature } from "@prisma/client";

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

const initialState: ProfileFormState = {};

export function ProfileForm({
  username,
  avatarUrl,
  city,
  state,
  zip,
  initialInterests,
  initialPreferences,
}: {
  username: string;
  avatarUrl: string | null;
  city: string;
  state: string;
  zip: string;
  initialInterests: Interest[];
  initialPreferences: AccessibilityFeature[];
}) {
  const [formState, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [interests, setInterests] = useState<Interest[]>(initialInterests);
  const [prefs, setPrefs] = useState<string[]>(initialPreferences);
  const announce = useAnnounce();
  const grouped = featuresByCategory();

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        announce("Profile updated");
      }}
      className="flex flex-col gap-8"
      noValidate
    >
      {formState.success && (
        <p role="status" className="rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          Your profile has been updated.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Basic information</h2>
        <TextField label="Username" name="username" defaultValue={username} required error={formState.fieldErrors?.username} />
        <ImageUpload name="avatarUrl" label="Profile photo" folder="avatars" defaultValue={avatarUrl} aspect="square" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <TextField label="City" name="city" defaultValue={city} required error={formState.fieldErrors?.city} />
          <TextField label="State" name="state" maxLength={2} defaultValue={state} required error={formState.fieldErrors?.state} />
          <TextField label="ZIP code" name="zip" defaultValue={zip} required error={formState.fieldErrors?.zip} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Interests</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(INTEREST_LABELS).map(([value, label]) => (
            <CheckboxCard
              key={value}
              id={`interest-${value}`}
              label={label}
              checked={interests.includes(value as Interest)}
              onChange={() =>
                setInterests((prev) =>
                  prev.includes(value as Interest) ? prev.filter((x) => x !== value) : [...prev, value as Interest],
                )
              }
            />
          ))}
        </div>
        {interests.map((i) => (
          <input key={i} type="hidden" name="interests" value={i} />
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-bold">Accessibility preferences</h2>
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
                  onChange={() =>
                    setPrefs((prev) => (prev.includes(feature) ? prev.filter((x) => x !== feature) : [...prev, feature]))
                  }
                />
              ))}
            </div>
          </fieldset>
        ))}
        {prefs.map((p) => (
          <input key={p} type="hidden" name="accessibilityPreferences" value={p} />
        ))}
      </section>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
