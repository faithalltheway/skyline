import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkApproveImportedEvents } from "@/services/moderationService";

export const maxDuration = 30;

// Admin-only trigger for the same bulk-publish action available from the
// moderation queue UI — lets it be scripted/re-run without a browser.
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await bulkApproveImportedEvents(session.user.id);
  return NextResponse.json({ status: "ok", published: count });
}
