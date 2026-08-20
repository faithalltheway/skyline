import "server-only";
import { db } from "@/lib/db";

async function logModerationAction(params: {
  actorId: string;
  actionType: Parameters<typeof db.moderationAction.create>[0]["data"]["actionType"];
  targetType: string;
  targetId: string;
  reason: string;
  notes?: string;
}) {
  await db.$transaction([
    db.moderationAction.create({ data: params }),
    db.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.actionType,
        entityType: params.targetType,
        entityId: params.targetId,
        metadata: { reason: params.reason, notes: params.notes },
      },
    }),
  ]);
}

export async function approveEvent(eventId: string, actorId: string, reason: string) {
  const event = await db.event.findUniqueOrThrow({ where: { id: eventId } });
  // Individually-hosted community events publish immediately once approved;
  // organization events move to APPROVED so the partner can publish on their
  // own schedule from the listings dashboard.
  const nextStatus = event.organizationId ? "APPROVED" : "PUBLISHED";

  await db.event.update({
    where: { id: eventId },
    data: {
      status: nextStatus,
      rejectionReason: null,
      publishedAt: nextStatus === "PUBLISHED" ? new Date() : null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: "APPROVE_EVENT",
    targetType: "EVENT",
    targetId: eventId,
    reason,
  });
}

/**
 * Publishes every automatically-imported event still sitting in
 * PENDING_REVIEW. Scoped to externalSource != null only — human-submitted
 * community/partner events always go through individual review, never this
 * bulk path. Imported events have no organizationId, so (matching
 * approveEvent's rule) they publish immediately rather than landing in
 * APPROVED.
 */
export async function bulkApproveImportedEvents(actorId: string): Promise<{ count: number }> {
  const result = await db.event.updateMany({
    where: { status: "PENDING_REVIEW", externalSource: { not: null } },
    data: { status: "PUBLISHED", publishedAt: new Date(), rejectionReason: null },
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: "BULK_APPROVE_IMPORTED_EVENTS",
      entityType: "SYSTEM",
      entityId: "moderation",
      metadata: { count: result.count },
    },
  });

  return { count: result.count };
}

/**
 * Permanently deletes every event sourced from Google Events, regardless of
 * current status. That source is confirmed unreliable (see README §11) and
 * its rows have degraded address data. All Event-referencing tables
 * (RSVP, SavedEvent, EventCategory, EventAccessibility, EventImage, Report,
 * EventAnalytics, FeaturedPlacement) cascade-delete cleanly.
 */
export async function bulkDeleteGoogleEvents(actorId: string): Promise<{ count: number }> {
  const toDelete = await db.event.findMany({ where: { externalSource: "GOOGLE_EVENTS" }, select: { id: true, title: true } });

  const result = await db.event.deleteMany({ where: { externalSource: "GOOGLE_EVENTS" } });

  await db.auditLog.create({
    data: {
      actorId,
      action: "BULK_DELETE_GOOGLE_EVENTS",
      entityType: "SYSTEM",
      entityId: "moderation",
      metadata: { count: result.count, deletedTitles: toDelete.map((e) => e.title) },
    },
  });

  return { count: result.count };
}

/**
 * Rejects (unpublishes) every event sourced from Google Events, regardless
 * of current status. That source is confirmed unreliable (see README §11)
 * and its rows have degraded address data — the rows are kept for audit
 * history rather than deleted, just pulled out of public view.
 */
export async function bulkUnpublishGoogleEvents(actorId: string, reason: string): Promise<{ count: number }> {
  const result = await db.event.updateMany({
    where: { externalSource: "GOOGLE_EVENTS" },
    data: { status: "REJECTED", rejectionReason: reason, publishedAt: null },
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: "BULK_UNPUBLISH_GOOGLE_EVENTS",
      entityType: "SYSTEM",
      entityId: "moderation",
      metadata: { count: result.count, reason },
    },
  });

  return { count: result.count };
}

export async function rejectEvent(eventId: string, actorId: string, reason: string) {
  await db.event.update({ where: { id: eventId }, data: { status: "REJECTED", rejectionReason: reason } });
  await logModerationAction({ actorId, actionType: "REJECT_EVENT", targetType: "EVENT", targetId: eventId, reason });
}

export async function requestEventChanges(eventId: string, actorId: string, reason: string) {
  await db.event.update({ where: { id: eventId }, data: { status: "DRAFT", rejectionReason: reason } });
  await logModerationAction({
    actorId,
    actionType: "REQUEST_CHANGES",
    targetType: "EVENT",
    targetId: eventId,
    reason,
  });
}

export async function suspendUser(userId: string, actorId: string, reason: string) {
  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await logModerationAction({ actorId, actionType: "SUSPEND_USER", targetType: "USER", targetId: userId, reason });
}

export async function banUser(userId: string, actorId: string, reason: string) {
  await db.user.update({ where: { id: userId }, data: { status: "BANNED" } });
  await logModerationAction({ actorId, actionType: "BAN_USER", targetType: "USER", targetId: userId, reason });
}

export async function restoreUser(userId: string, actorId: string, reason: string) {
  await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await logModerationAction({ actorId, actionType: "RESTORE_USER", targetType: "USER", targetId: userId, reason });
}

export async function verifyOrganization(organizationId: string, actorId: string, reason: string) {
  await db.$transaction([
    db.organization.update({ where: { id: organizationId }, data: { verificationStatus: "VERIFIED" } }),
    db.organizationVerification.update({
      where: { organizationId },
      data: { status: "VERIFIED", reviewedAt: new Date(), reviewedById: actorId },
    }),
  ]);
  await logModerationAction({
    actorId,
    actionType: "VERIFY_ORGANIZATION",
    targetType: "ORGANIZATION",
    targetId: organizationId,
    reason,
  });
}

export async function rejectOrganizationVerification(organizationId: string, actorId: string, reason: string) {
  await db.$transaction([
    db.organization.update({ where: { id: organizationId }, data: { verificationStatus: "REJECTED" } }),
    db.organizationVerification.update({
      where: { organizationId },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: actorId, notes: reason },
    }),
  ]);
  await logModerationAction({
    actorId,
    actionType: "REJECT_ORGANIZATION_VERIFICATION",
    targetType: "ORGANIZATION",
    targetId: organizationId,
    reason,
  });
}

export async function suspendOrganization(organizationId: string, actorId: string, reason: string) {
  await db.organization.update({ where: { id: organizationId }, data: { deletedAt: new Date() } });
  await logModerationAction({
    actorId,
    actionType: "SUSPEND_ORGANIZATION",
    targetType: "ORGANIZATION",
    targetId: organizationId,
    reason,
  });
}

export async function restoreOrganization(organizationId: string, actorId: string, reason: string) {
  await db.organization.update({ where: { id: organizationId }, data: { deletedAt: null } });
  await logModerationAction({
    actorId,
    actionType: "RESTORE_ORGANIZATION",
    targetType: "ORGANIZATION",
    targetId: organizationId,
    reason,
  });
}

export async function resolveReport(reportId: string, actorId: string, reason: string) {
  await db.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", resolvedById: actorId, resolvedAt: new Date(), resolutionNotes: reason },
  });
  await logModerationAction({ actorId, actionType: "RESOLVE_REPORT", targetType: "REPORT", targetId: reportId, reason });
}

export async function dismissReport(reportId: string, actorId: string, reason: string) {
  await db.report.update({
    where: { id: reportId },
    data: { status: "DISMISSED", resolvedById: actorId, resolvedAt: new Date(), resolutionNotes: reason },
  });
  await logModerationAction({ actorId, actionType: "DISMISS_REPORT", targetType: "REPORT", targetId: reportId, reason });
}
