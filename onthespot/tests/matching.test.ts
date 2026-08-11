import { describe, expect, it } from "vitest";
import { calculateAccessibilityMatch, matchLabel } from "@/lib/matching";
import type { EventAccessibilityRecord } from "@/lib/matching";

describe("calculateAccessibilityMatch", () => {
  it("returns 100% when the user has no requirements", () => {
    const result = calculateAccessibilityMatch([], []);
    expect(result.percent).toBe(100);
    expect(result.totalRequired).toBe(0);
  });

  it("computes the documented example: 4 of 5 confirmed = 80%", () => {
    const requirements = [
      "WHEELCHAIR_ACCESSIBLE",
      "ACCESSIBLE_RESTROOM",
      "COMPANION_SEATING",
      "SERVICE_ANIMALS_ALLOWED",
      "LOW_NOISE_ENVIRONMENT",
    ] as const;
    const eventAccessibility: EventAccessibilityRecord[] = [
      { feature: "WHEELCHAIR_ACCESSIBLE", state: "CONFIRMED" },
      { feature: "ACCESSIBLE_RESTROOM", state: "CONFIRMED" },
      { feature: "COMPANION_SEATING", state: "CONFIRMED" },
      { feature: "SERVICE_ANIMALS_ALLOWED", state: "CONFIRMED" },
      { feature: "LOW_NOISE_ENVIRONMENT", state: "NOT_AVAILABLE" },
    ];

    const result = calculateAccessibilityMatch([...requirements], eventAccessibility);
    expect(result.percent).toBe(80);
    expect(result.confirmedCount).toBe(4);
    expect(result.unmet).toEqual(["LOW_NOISE_ENVIRONMENT"]);
    expect(result.summary).toBe("Matches 4 of your 5 accessibility preferences");
  });

  it("never treats UNKNOWN as a match", () => {
    const result = calculateAccessibilityMatch(["WHEELCHAIR_ACCESSIBLE"], [
      { feature: "WHEELCHAIR_ACCESSIBLE", state: "UNKNOWN" },
    ]);
    expect(result.percent).toBe(0);
    expect(result.unmet).toContain("WHEELCHAIR_ACCESSIBLE");
  });

  it("treats a feature missing from the event entirely as UNKNOWN, not a match", () => {
    const result = calculateAccessibilityMatch(["ASL_INTERPRETATION"], []);
    expect(result.percent).toBe(0);
    expect(result.breakdown[0].state).toBe("UNKNOWN");
  });

  it("distinguishes NOT_AVAILABLE from UNKNOWN in the breakdown", () => {
    const result = calculateAccessibilityMatch(["CAPTIONS", "BRAILLE_SIGNAGE"], [
      { feature: "CAPTIONS", state: "NOT_AVAILABLE" },
    ]);
    const captions = result.breakdown.find((b) => b.feature === "CAPTIONS");
    const braille = result.breakdown.find((b) => b.feature === "BRAILLE_SIGNAGE");
    expect(captions?.state).toBe("NOT_AVAILABLE");
    expect(braille?.state).toBe("UNKNOWN");
  });
});

describe("matchLabel", () => {
  it("labels high, medium, and low match tiers correctly", () => {
    expect(matchLabel(100).tone).toBe("high");
    expect(matchLabel(80).tone).toBe("high");
    expect(matchLabel(79).tone).toBe("medium");
    expect(matchLabel(50).tone).toBe("medium");
    expect(matchLabel(49).tone).toBe("low");
    expect(matchLabel(0).tone).toBe("low");
  });
});
