import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkDeleteGoogleEvents } from "@/services/moderationService";

export const maxDuration = 30;

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await bulkDeleteGoogleEvents(session.user.id);
  return NextResponse.json({ status: "ok", deleted: count });
}
