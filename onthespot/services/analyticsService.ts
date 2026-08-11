import "server-only";
import { db } from "@/lib/db";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function recordEventView(eventId: string) {
  const date = startOfToday();
  await db.$transaction([
    db.event.update({ where: { id: eventId }, data: { viewCount: { increment: 1 } } }),
    db.eventAnalytics.upsert({
      where: { eventId_date: { eventId, date } },
      update: { views: { increment: 1 }, uniqueVisitors: { increment: 1 } },
      create: { eventId, date, views: 1, uniqueVisitors: 1 },
    }),
  ]);
}

export async function recordEventSave(eventId: string, delta: 1 | -1) {
  const date = startOfToday();
  await db.eventAnalytics.upsert({
    where: { eventId_date: { eventId, date } },
    update: { saves: { increment: delta } },
    create: { eventId, date, saves: Math.max(delta, 0) },
  });
}

export async function recordEventRsvp(eventId: string) {
  const date = startOfToday();
  await db.eventAnalytics.upsert({
    where: { eventId_date: { eventId, date } },
    update: { rsvps: { increment: 1 } },
    create: { eventId, date, rsvps: 1 },
  });
}

export interface AnalyticsSummary {
  views: number;
  uniqueVisitors: number;
  rsvps: number;
  saves: number;
  conversionRate: number;
  series: { date: string; views: number; rsvps: number; saves: number }[];
}

export async function getEventAnalytics(eventId: string, days: number): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db.eventAnalytics.findMany({
    where: { eventId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const views = rows.reduce((s, r) => s + r.views, 0);
  const uniqueVisitors = rows.reduce((s, r) => s + r.uniqueVisitors, 0);
  const rsvps = rows.reduce((s, r) => s + r.rsvps, 0);
  const saves = rows.reduce((s, r) => s + r.saves, 0);

  return {
    views,
    uniqueVisitors,
    rsvps,
    saves,
    conversionRate: views > 0 ? Math.round((rsvps / views) * 1000) / 10 : 0,
    series: rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      views: r.views,
      rsvps: r.rsvps,
      saves: r.saves,
    })),
  };
}

export async function getOrganizationAnalytics(organizationId: string, days: number) {
  const events = await db.event.findMany({ where: { organizationId }, select: { id: true } });
  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) {
    return { views: 0, uniqueVisitors: 0, rsvps: 0, saves: 0, conversionRate: 0, series: [] };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db.eventAnalytics.findMany({
    where: { eventId: { in: eventIds }, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const byDate = new Map<string, { views: number; rsvps: number; saves: number }>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { views: 0, rsvps: 0, saves: 0 };
    existing.views += row.views;
    existing.rsvps += row.rsvps;
    existing.saves += row.saves;
    byDate.set(key, existing);
  }

  const views = rows.reduce((s, r) => s + r.views, 0);
  const uniqueVisitors = rows.reduce((s, r) => s + r.uniqueVisitors, 0);
  const rsvps = rows.reduce((s, r) => s + r.rsvps, 0);
  const saves = rows.reduce((s, r) => s + r.saves, 0);

  return {
    views,
    uniqueVisitors,
    rsvps,
    saves,
    conversionRate: views > 0 ? Math.round((rsvps / views) * 1000) / 10 : 0,
    series: Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v })),
  };
}
