import { AccessibilityFeature } from "@prisma/client";

export type AccessibilityCategory =
  | "MOBILITY"
  | "SENSORY"
  | "HEARING"
  | "VISION"
  | "ADDITIONAL";

export const ACCESSIBILITY_CATEGORY_LABELS: Record<AccessibilityCategory, string> = {
  MOBILITY: "Mobility",
  SENSORY: "Sensory",
  HEARING: "Hearing",
  VISION: "Vision",
  ADDITIONAL: "Service Animals, Caregivers & Transportation",
};

interface FeatureMeta {
  category: AccessibilityCategory;
  label: string;
  shortLabel: string;
  description: string;
}

export const ACCESSIBILITY_FEATURE_META: Record<AccessibilityFeature, FeatureMeta> = {
  WHEELCHAIR_ACCESSIBLE: {
    category: "MOBILITY",
    label: "Wheelchair accessible",
    shortLabel: "Wheelchair accessible",
    description: "The venue can be navigated by wheelchair users.",
  },
  POWER_WHEELCHAIR_ACCESSIBLE: {
    category: "MOBILITY",
    label: "Power wheelchair accessible",
    shortLabel: "Power wheelchair accessible",
    description: "Pathways and doorways accommodate power wheelchairs and scooters.",
  },
  STEP_FREE_ENTRANCE: {
    category: "MOBILITY",
    label: "Step-free entrance",
    shortLabel: "Step-free entrance",
    description: "The main entrance has no steps.",
  },
  ELEVATOR_AVAILABLE: {
    category: "MOBILITY",
    label: "Elevator available",
    shortLabel: "Elevator available",
    description: "An elevator is available to reach all event levels.",
  },
  ACCESSIBLE_PARKING: {
    category: "MOBILITY",
    label: "Accessible parking",
    shortLabel: "Accessible parking",
    description: "Designated accessible parking is available near the venue.",
  },
  ACCESSIBLE_RESTROOM: {
    category: "MOBILITY",
    label: "Accessible restroom",
    shortLabel: "Accessible restroom",
    description: "An ADA-accessible restroom is available on site.",
  },
  ACCESSIBLE_SEATING: {
    category: "MOBILITY",
    label: "Accessible seating",
    shortLabel: "Accessible seating",
    description: "Designated accessible seating areas are available.",
  },
  COMPANION_SEATING: {
    category: "MOBILITY",
    label: "Companion / caregiver seating",
    shortLabel: "Companion seating",
    description: "Seating for a companion or caregiver is available next to accessible seating.",
  },
  WIDE_DOORWAYS: {
    category: "MOBILITY",
    label: "Wide doorways",
    shortLabel: "Wide doorways",
    description: "Doorways are wide enough for mobility devices.",
  },
  SMOOTH_PATHWAYS: {
    category: "MOBILITY",
    label: "Smooth pathways",
    shortLabel: "Smooth pathways",
    description: "Pathways are paved/smooth and free of obstacles.",
  },
  SENSORY_FRIENDLY: {
    category: "SENSORY",
    label: "Sensory-friendly",
    shortLabel: "Sensory-friendly",
    description: "The event is designed to reduce sensory overload.",
  },
  LOW_NOISE_ENVIRONMENT: {
    category: "SENSORY",
    label: "Low-noise environment",
    shortLabel: "Low noise",
    description: "Sound levels are kept low throughout the event.",
  },
  QUIET_ROOM: {
    category: "SENSORY",
    label: "Quiet room available",
    shortLabel: "Quiet room",
    description: "A quiet room or space is available to decompress.",
  },
  LOW_LIGHTING_AVAILABLE: {
    category: "SENSORY",
    label: "Low lighting available",
    shortLabel: "Low lighting",
    description: "Areas with dimmed lighting are available.",
  },
  REDUCED_FLASHING_LIGHTS: {
    category: "SENSORY",
    label: "Reduced flashing lights",
    shortLabel: "Reduced flashing lights",
    description: "Strobe/flashing lights are minimized or absent.",
  },
  CROWD_LEVEL_INFO: {
    category: "SENSORY",
    label: "Crowd level information provided",
    shortLabel: "Crowd level info",
    description: "Expected crowd density is communicated in advance.",
  },
  ASL_INTERPRETATION: {
    category: "HEARING",
    label: "ASL interpretation",
    shortLabel: "ASL interpretation",
    description: "American Sign Language interpretation is provided.",
  },
  ASSISTIVE_LISTENING_DEVICES: {
    category: "HEARING",
    label: "Assistive listening devices",
    shortLabel: "Assistive listening devices",
    description: "Assistive listening devices are available on request.",
  },
  CAPTIONS: {
    category: "HEARING",
    label: "Captions provided",
    shortLabel: "Captions",
    description: "Live or recorded captions are provided.",
  },
  WRITTEN_COMMUNICATION_AVAILABLE: {
    category: "HEARING",
    label: "Written communication available",
    shortLabel: "Written communication",
    description: "Staff can communicate in writing on request.",
  },
  AUDIO_DESCRIPTION: {
    category: "VISION",
    label: "Audio description",
    shortLabel: "Audio description",
    description: "Live audio description of visual elements is available.",
  },
  BRAILLE_SIGNAGE: {
    category: "VISION",
    label: "Braille signage",
    shortLabel: "Braille signage",
    description: "Braille signage is available throughout the venue.",
  },
  LARGE_PRINT_MATERIALS: {
    category: "VISION",
    label: "Large-print materials",
    shortLabel: "Large-print materials",
    description: "Large-print programs or materials are available.",
  },
  SCREEN_READER_FRIENDLY_INFO: {
    category: "VISION",
    label: "Screen-reader-friendly digital information",
    shortLabel: "Screen-reader friendly",
    description: "Digital event information is accessible to screen readers.",
  },
  SERVICE_ANIMALS_ALLOWED: {
    category: "ADDITIONAL",
    label: "Service animals allowed",
    shortLabel: "Service animals allowed",
    description: "Service animals are welcome at this event.",
  },
  CAREGIVER_FRIENDLY: {
    category: "ADDITIONAL",
    label: "Caregiver friendly",
    shortLabel: "Caregiver friendly",
    description: "Caregivers are accommodated (free/discounted entry, space, etc).",
  },
  ACCESSIBLE_TRANSPORTATION_NEARBY: {
    category: "ADDITIONAL",
    label: "Accessible transportation nearby",
    shortLabel: "Accessible transportation",
    description: "Accessible public or paratransit options are available nearby.",
  },
  ACCESSIBLE_DROPOFF_AREA: {
    category: "ADDITIONAL",
    label: "Accessible drop-off area",
    shortLabel: "Accessible drop-off",
    description: "A designated accessible drop-off area is available.",
  },
};

export const ALL_ACCESSIBILITY_FEATURES = Object.keys(
  ACCESSIBILITY_FEATURE_META,
) as AccessibilityFeature[];

export const ACCESSIBILITY_CATEGORIES: AccessibilityCategory[] = [
  "MOBILITY",
  "SENSORY",
  "HEARING",
  "VISION",
  "ADDITIONAL",
];

export function featuresByCategory(): Record<AccessibilityCategory, AccessibilityFeature[]> {
  const grouped = {
    MOBILITY: [],
    SENSORY: [],
    HEARING: [],
    VISION: [],
    ADDITIONAL: [],
  } as Record<AccessibilityCategory, AccessibilityFeature[]>;

  for (const feature of ALL_ACCESSIBILITY_FEATURES) {
    grouped[ACCESSIBILITY_FEATURE_META[feature].category].push(feature);
  }
  return grouped;
}
