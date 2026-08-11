import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { eventFormSchema, partnerEventFormSchema } from "@/lib/validations/event";

describe("registerSchema", () => {
  it("accepts a valid individual registration", () => {
    const result = registerSchema.safeParse({
      name: "Jamie Rivera",
      email: "jamie@example.com",
      password: "password123",
      accountType: "USER",
    });
    expect(result.success).toBe(true);
  });

  it("requires an organization name for partner accounts", () => {
    const result = registerSchema.safeParse({
      name: "Jamie Rivera",
      email: "jamie@example.com",
      password: "password123",
      accountType: "PARTNER",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      name: "Jamie Rivera",
      email: "jamie@example.com",
      password: "allletters",
      accountType: "USER",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed emails", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });
});

const baseEvent = {
  title: "Community Picnic",
  description: "A relaxed afternoon picnic open to the whole neighborhood, rain or shine.",
  categories: ["food"],
  startAt: "2030-01-01T12:00",
  endAt: "2030-01-01T14:00",
  venueName: "Central Park",
  addressLine1: "123 Main St",
  city: "Waco",
  state: "TX",
  zip: "76701",
  latitude: 31.5493,
  longitude: -97.1467,
  indoorOutdoor: "OUTDOOR" as const,
  isFree: true,
};

describe("eventFormSchema", () => {
  it("accepts a well-formed community event", () => {
    expect(eventFormSchema.safeParse(baseEvent).success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = eventFormSchema.safeParse({ ...baseEvent, endAt: "2029-12-31T10:00" });
    expect(result.success).toBe(false);
  });

  it("does not require accessibility contact info for individual hosts", () => {
    const result = eventFormSchema.safeParse(baseEvent);
    expect(result.success).toBe(true);
  });
});

describe("partnerEventFormSchema", () => {
  it("requires accessibility contact name and email for organization listings", () => {
    const result = partnerEventFormSchema.safeParse(baseEvent);
    expect(result.success).toBe(false);
  });

  it("accepts when accessibility contact info is present", () => {
    const result = partnerEventFormSchema.safeParse({
      ...baseEvent,
      accessibilityContactName: "Access Team",
      accessibilityContactEmail: "access@example.com",
    });
    expect(result.success).toBe(true);
  });
});
