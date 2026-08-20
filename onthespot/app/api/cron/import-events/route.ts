import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runReliableSourcesImport } from "@/services/eventImportService";

export const maxDuration = 60;

function isAuthorized(request: Request, adminUser: { role: string } | undefined): boolean {
  // Vercel Cron calls this with `Authorization: Bearer <CRON_SECRET>` when a
  // secret is configured. An authenticated admin hitting it manually (the
  // "Sync now" button) is also allowed.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header === `Bearer ${secret}`) return true;
  }
  return adminUser?.role === "ADMIN";
}

export async function GET(request: Request) {
  const session = await auth();

  if (!isAuthorized(request, session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.TICKETMASTER_API_KEY && !process.env.PREDICTHQ_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Neither TICKETMASTER_API_KEY nor PREDICTHQ_ACCESS_TOKEN is configured" }, { status: 503 });
  }

  const summaries = await runReliableSourcesImport();
  const totalImported = summaries.reduce((sum, s) => sum + s.imported, 0);

  return NextResponse.json({ status: "ok", totalImported, summaries });
}
