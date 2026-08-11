import { describe, expect, it } from "vitest";
import { haversineDistanceMiles, boundingBox } from "@/lib/geo";

describe("haversineDistanceMiles", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistanceMiles(30.2672, -97.7431, 30.2672, -97.7431)).toBeCloseTo(0, 5);
  });

  it("computes a realistic distance between Austin and Waco (~90-100 miles)", () => {
    const distance = haversineDistanceMiles(30.2672, -97.7431, 31.5493, -97.1467);
    expect(distance).toBeGreaterThan(85);
    expect(distance).toBeLessThan(105);
  });
});

describe("boundingBox", () => {
  it("produces a box that contains the origin point", () => {
    const box = boundingBox(30.2672, -97.7431, 25);
    expect(box.minLat).toBeLessThan(30.2672);
    expect(box.maxLat).toBeGreaterThan(30.2672);
    expect(box.minLon).toBeLessThan(-97.7431);
    expect(box.maxLon).toBeGreaterThan(-97.7431);
  });
});
