import { describe, expect, it, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createEvent, accessibilityCompletionPercent } from "@/services/eventCreationService";
import { createTestUser } from "./helpers";

const baseInput = {
  title: "Neighborhood Cleanup",
  description: "A community effort to clean up the local park.",
  categories: [] as string[],
  startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
  isRecurring: false,
  venueName: "Local Park",
  addressLine1: "1 Park Way",
  city: "Waco",
  state: "tx",
  zip: "76701",
  latitude: 31.5493,
  longitude: -97.1467,
  indoorOutdoor: "OUTDOOR" as const,
  isFree: true,
  images: [] as string[],
  accessibilityAnswers: [
    { feature: "WHEELCHAIR_ACCESSIBLE" as const, state: "CONFIRMED" as const },
    { feature: "ACCESSIBLE_PARKING" as const, state: "UNKNOWN" as const },
  ],
};

describe("eventCreationService.createEvent", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("submits new community events into moderation (PENDING_REVIEW), never publishing directly", async () => {
    const user = await createTestUser();
    const event = await createEvent(baseInput, { userId: user.id }, "PENDING_REVIEW");
    expect(event.status).toBe("PENDING_REVIEW");
  });

  it("stores structured accessibility rows rather than free text", async () => {
    const user = await createTestUser();
    const event = await createEvent(baseInput, { userId: user.id });
    const rows = await db.eventAccessibility.findMany({ where: { eventId: event.id } });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.feature === "WHEELCHAIR_ACCESSIBLE")?.state).toBe("CONFIRMED");
  });

  it("generates a unique slug even for duplicate titles", async () => {
    const user = await createTestUser();
    const first = await createEvent(baseInput, { userId: user.id });
    const second = await createEvent(baseInput, { userId: user.id });
    expect(first.slug).not.toBe(second.slug);
  });

  it("writes an audit log entry on submission", async () => {
    const user = await createTestUser();
    const event = await createEvent(baseInput, { userId: user.id });
    const logs = await db.auditLog.findMany({ where: { entityId: event.id, action: "EVENT_SUBMITTED" } });
    expect(logs).toHaveLength(1);
  });
});

describe("accessibilityCompletionPercent", () => {
  it("only counts CONFIRMED/NOT_AVAILABLE answers as complete, never UNKNOWN", () => {
    const answers = [{ state: "CONFIRMED" as const }, { state: "UNKNOWN" as const }, { state: "NOT_AVAILABLE" as const }];
    expect(accessibilityCompletionPercent(answers, 4)).toBe(50);
  });
});
