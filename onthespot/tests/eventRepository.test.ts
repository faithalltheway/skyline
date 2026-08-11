import { describe, expect, it } from "vitest";
import { buildEventWhere } from "@/repositories/eventRepository";

describe("buildEventWhere", () => {
  it("excludes soft-deleted events and defaults to upcoming only", () => {
    const where = buildEventWhere({});
    expect(where.deletedAt).toBeNull();
    expect(where.endAt).toBeDefined();
  });

  it("filters by free/paid price", () => {
    expect(buildEventWhere({ price: "free" }).isFree).toBe(true);
    expect(buildEventWhere({ price: "paid" }).isFree).toBe(false);
  });

  it("uses OR-based matching for accessibility filters by default", () => {
    const where = buildEventWhere({ accessibility: ["WHEELCHAIR_ACCESSIBLE", "CAPTIONS"] });
    expect(where.accessibility).toEqual({
      some: { feature: { in: ["WHEELCHAIR_ACCESSIBLE", "CAPTIONS"] }, state: "CONFIRMED" },
    });
  });

  it("uses AND-based matching (one clause per feature) when matchAll is set", () => {
    const where = buildEventWhere({ accessibility: ["WHEELCHAIR_ACCESSIBLE", "CAPTIONS"], matchAll: true });
    expect(Array.isArray(where.AND)).toBe(true);
    expect((where.AND as unknown[]).length).toBe(2);
  });

  it("builds a bounding box when lat/lng/radius are provided", () => {
    const where = buildEventWhere({ lat: 30.2672, lng: -97.7431, radiusMiles: 25 });
    expect(where.latitude).toBeDefined();
    expect(where.longitude).toBeDefined();
  });

  it("includes past events only when includePast is set", () => {
    expect(buildEventWhere({}).endAt).toBeDefined();
    expect(buildEventWhere({ includePast: true }).endAt).toBeUndefined();
  });
});
