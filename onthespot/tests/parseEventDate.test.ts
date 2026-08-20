import { describe, expect, it } from "vitest";
import { parseGoogleEventDate } from "@/lib/parseEventDate";

describe("parseGoogleEventDate", () => {
  it("returns null when there's no month/day to anchor on", () => {
    expect(parseGoogleEventDate(undefined, undefined)).toBeNull();
    expect(parseGoogleEventDate("", "Postponed")).toBeNull();
  });

  it("parses a start_date plus a time range in `when`", () => {
    const result = parseGoogleEventDate("Aug 19", "Wed, Aug 19, 7 – 10 PM");
    expect(result).not.toBeNull();
    expect(result!.startAt.getMonth()).toBe(7); // August (0-indexed)
    expect(result!.startAt.getDate()).toBe(19);
    expect(result!.startAt.getHours()).toBe(19);
    expect(result!.endAt.getHours()).toBe(22);
  });

  it("defaults to a 2-hour window when no end time is given", () => {
    const result = parseGoogleEventDate("Sep 5", "Fri, Sep 5, 7 PM");
    expect(result).not.toBeNull();
    expect(result!.endAt.getTime() - result!.startAt.getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it("never produces an end time before the start time", () => {
    const result = parseGoogleEventDate("Oct 1", "Wed, Oct 1, 11 PM – 1 AM");
    expect(result).not.toBeNull();
    expect(result!.endAt.getTime()).toBeGreaterThan(result!.startAt.getTime());
  });
});
