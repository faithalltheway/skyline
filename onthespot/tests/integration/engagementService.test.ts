import { describe, expect, it, afterAll } from "vitest";
import { db } from "@/lib/db";
import * as engagementService from "@/services/engagementService";
import { createTestUser, createTestEvent } from "./helpers";

describe("engagementService", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("prevents duplicate RSVPs by upserting on (eventId, userId)", async () => {
    const user = await createTestUser();
    const event = await createTestEvent(user.id);

    await engagementService.setRsvp(user.id, event.id, "GOING");
    await engagementService.setRsvp(user.id, event.id, "INTERESTED");

    const rsvps = await db.rSVP.findMany({ where: { eventId: event.id, userId: user.id } });
    expect(rsvps).toHaveLength(1);
    expect(rsvps[0].status).toBe("INTERESTED");
  });

  it("toggles saved events on and off", async () => {
    const user = await createTestUser();
    const event = await createTestEvent(user.id);

    const savedFirst = await engagementService.toggleSave(user.id, event.id);
    expect(savedFirst).toBe(true);

    const savedSecond = await engagementService.toggleSave(user.id, event.id);
    expect(savedSecond).toBe(false);

    const rows = await db.savedEvent.findMany({ where: { userId: user.id, eventId: event.id } });
    expect(rows).toHaveLength(0);
  });

  it("toggles follows on an organization", async () => {
    const follower = await createTestUser();
    const owner = await createTestUser({ role: "PARTNER" });
    const org = await db.organization.create({
      data: {
        name: "Test Org",
        slug: `test-org-${Date.now()}`,
        contactEmail: owner.email,
        members: { create: { userId: owner.id, role: "OWNER" } },
      },
    });

    const followingFirst = await engagementService.toggleFollow(follower.id, org.id);
    expect(followingFirst).toBe(true);
    const followingSecond = await engagementService.toggleFollow(follower.id, org.id);
    expect(followingSecond).toBe(false);
  });
});
