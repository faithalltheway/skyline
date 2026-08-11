import { describe, expect, it } from "vitest";
import {
  ALL_ACCESSIBILITY_FEATURES,
  ACCESSIBILITY_CATEGORIES,
  featuresByCategory,
  ACCESSIBILITY_FEATURE_META,
} from "@/lib/accessibility";

describe("accessibility feature catalog", () => {
  it("defines metadata for every feature", () => {
    for (const feature of ALL_ACCESSIBILITY_FEATURES) {
      expect(ACCESSIBILITY_FEATURE_META[feature]).toBeDefined();
      expect(ACCESSIBILITY_FEATURE_META[feature].label.length).toBeGreaterThan(0);
    }
  });

  it("groups every feature into exactly one of the five categories", () => {
    const grouped = featuresByCategory();
    const groupedFeatures = ACCESSIBILITY_CATEGORIES.flatMap((c) => grouped[c]);
    expect(new Set(groupedFeatures).size).toBe(ALL_ACCESSIBILITY_FEATURES.length);
    expect(groupedFeatures.length).toBe(ALL_ACCESSIBILITY_FEATURES.length);
  });

  it("covers all five required categories", () => {
    expect(ACCESSIBILITY_CATEGORIES).toEqual(["MOBILITY", "SENSORY", "HEARING", "VISION", "ADDITIONAL"]);
  });
});
