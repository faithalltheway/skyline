import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runGoogleEventsImport } from "@/services/eventImportService";

export const maxDuration = 60;

// Manual-only (no Vercel Cron entry) — Google Events is unreliable via any
// scraping/proxy IP; see README.md §11. Admins can still retest it here.
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SERPAPI_KEY) {
    return NextResponse.json({ error: "SERPAPI_KEY is not configured" }, { status: 503 });
  }

  const summaries = await runGoogleEventsImport();
  const totalImported = summaries.reduce((sum, s) => sum + s.imported, 0);

  return NextResponse.json({ status: "ok", totalImported, summaries });
}
