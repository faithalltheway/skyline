import { describe, expect, it, afterAll } from "vitest";
import { db } from "@/lib/db";
import * as moderationService from "@/services/moderationService";
import { createTestUser, createTestEvent } from "./helpers";

describe("moderationService", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("publishes individually-hosted events immediately on approval", async () => {
    const admin = await createTestUser({ role: "ADMIN" });
    const host = await createTestUser();
    const event = await createTestEvent(host.id, { status: "PENDING_REVIEW" });

    await moderationService.approveEvent(event.id, admin.id, "Looks good");

    const updated = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(updated.status).toBe("PUBLISHED");
    expect(updated.publishedAt).not.toBeNull();
  });

  it("moves organization-hosted events to APPROVED (not published) so the partner can publish", async () => {
    const admin = await createTestUser({ role: "ADMIN" });
    const owner = await createTestUser({ role: "PARTNER" });
    const org = await db.organization.create({
      data: { name: "Org", slug: `org-${Date.now()}`, contactEmail: owner.email, members: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const event = await createTestEvent(owner.id, { status: "PENDING_REVIEW", organizationId: org.id });

    await moderationService.approveEvent(event.id, admin.id, "Looks good");

    const updated = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(updated.status).toBe("APPROVED");
    expect(updated.publishedAt).toBeNull();
  });

  it("records a reason and writes an audit log entry when rejecting an event", async () => {
    const admin = await createTestUser({ role: "ADMIN" });
    const host = await createTestUser();
    const event = await createTestEvent(host.id, { status: "PENDING_REVIEW" });

    await moderationService.rejectEvent(event.id, admin.id, "Missing accessibility details");

    const updated = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(updated.status).toBe("REJECTED");
    expect(updated.rejectionReason).toBe("Missing accessibility details");

    const auditEntries = await db.auditLog.findMany({ where: { entityId: event.id, action: "REJECT_EVENT" } });
    expect(auditEntries).toHaveLength(1);

    const modActions = await db.moderationAction.findMany({ where: { targetId: event.id, actionType: "REJECT_EVENT" } });
    expect(modActions).toHaveLength(1);
    expect(modActions[0].reason).toBe("Missing accessibility details");
  });

  it("suspends and restores a user", async () => {
    const admin = await createTestUser({ role: "ADMIN" });
    const target = await createTestUser();

    await moderationService.suspendUser(target.id, admin.id, "Spam reports");
    expect((await db.user.findUniqueOrThrow({ where: { id: target.id } })).status).toBe("SUSPENDED");

    await moderationService.restoreUser(target.id, admin.id, "Appeal accepted");
    expect((await db.user.findUniqueOrThrow({ where: { id: target.id } })).status).toBe("ACTIVE");
  });
});
