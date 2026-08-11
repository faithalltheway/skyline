import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

let counter = 0;
function unique(prefix: string) {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${counter}-${random}`;
}

export async function createTestUser(overrides: Partial<{ role: "USER" | "PARTNER" | "ADMIN" }> = {}) {
  const id = unique("user");
  return db.user.create({
    data: {
      name: `Test ${id}`,
      email: `${id}@test.local`,
      passwordHash: await hashPassword("Password123"),
      role: overrides.role ?? "USER",
      profile: { create: { username: id } },
    },
  });
}

export async function createTestEvent(createdById: string, overrides: Partial<{ status: string; organizationId: string }> = {}) {
  const id = unique("event");
  return db.event.create({
    data: {
      slug: id,
      title: `Test event ${id}`,
      description: "A test event used for integration testing.",
      createdById,
      organizationId: overrides.organizationId,
      status: (overrides.status as never) ?? "PUBLISHED",
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      venueName: "Test Venue",
      addressLine1: "123 Test St",
      city: "Waco",
      state: "TX",
      zip: "76701",
      latitude: 31.5493,
      longitude: -97.1467,
    },
  });
}
