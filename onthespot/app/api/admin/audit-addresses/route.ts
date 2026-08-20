import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const maxDuration = 30;

// Read-only diagnostic: flags events whose address/coordinate data is
// missing or a known importer fallback placeholder, broken down by source,
// so bad location data can be found without a direct DB connection.
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // latitude/longitude are non-nullable on Event, so there's no null-coordinate case to check.
  const [total, placeholderAddress, placeholderZip, zeroCoords, bySource] = await Promise.all([
    db.event.count(),
    db.event.count({ where: { addressLine1: "Address not provided" } }),
    db.event.count({ where: { zip: "00000" } }),
    db.event.count({ where: { latitude: 0, longitude: 0 } }),
    db.event.groupBy({
      by: ["externalSource"],
      _count: { _all: true },
      where: {
        OR: [{ addressLine1: "Address not provided" }, { zip: "00000" }, { latitude: 0, longitude: 0 }],
      },
    }),
  ]);

  const samples = await db.event.findMany({
    where: {
      OR: [{ addressLine1: "Address not provided" }, { zip: "00000" }, { latitude: 0, longitude: 0 }],
    },
    select: { id: true, title: true, slug: true, externalSource: true, venueName: true, addressLine1: true, city: true, state: true, zip: true, latitude: true, longitude: true, status: true },
    take: 20,
  });

  return NextResponse.json({
    totalEvents: total,
    withPlaceholderAddress: placeholderAddress,
    withPlaceholderZip: placeholderZip,
    withZeroCoordinates: zeroCoords,
    affectedBySource: bySource.map((b) => ({ source: b.externalSource ?? "USER_SUBMITTED", count: b._count._all })),
    sampleAffectedEvents: samples,
  });
}
