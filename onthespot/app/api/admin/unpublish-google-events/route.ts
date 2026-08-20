import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkUnpublishGoogleEvents } from "@/services/moderationService";

export const maxDuration = 30;

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await bulkUnpublishGoogleEvents(
    session.user.id,
    "Google Events source confirmed unreliable (see README §11) and has degraded address data.",
  );
  return NextResponse.json({ status: "ok", unpublished: count });
}
