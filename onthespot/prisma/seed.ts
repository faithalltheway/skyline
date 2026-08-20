import { PrismaClient, AccessibilityFeature, AccessibilityState, Interest } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function pickMany<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function jitter(base: number, spreadMiles: number) {
  const spreadDegrees = spreadMiles / 69;
  return base + (Math.random() - 0.5) * 2 * spreadDegrees;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const CITIES = [
  { city: "Waco", state: "TX", lat: 31.5493, lng: -97.1467 },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797 },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
];

const ALL_FEATURES = Object.values(AccessibilityFeature);

/** Builds a realistic, varying accessibility answer set for an event. */
function randomAccessibilityAnswers(profile: "high" | "medium" | "low") {
  return ALL_FEATURES.map((feature) => {
    let state: AccessibilityState;
    const roll = Math.random();
    if (profile === "high") {
      state = roll < 0.75 ? "CONFIRMED" : roll < 0.9 ? "UNKNOWN" : "NOT_AVAILABLE";
    } else if (profile === "medium") {
      state = roll < 0.4 ? "CONFIRMED" : roll < 0.75 ? "UNKNOWN" : "NOT_AVAILABLE";
    } else {
      state = roll < 0.15 ? "CONFIRMED" : roll < 0.55 ? "UNKNOWN" : "NOT_AVAILABLE";
    }
    return { feature, state };
  });
}

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

// ---------------------------------------------------------------------------
// Static content
// ---------------------------------------------------------------------------

const CATEGORY_DEFS = [
  { name: "Concert", icon: "🎵" },
  { name: "Comedy", icon: "😂" },
  { name: "Sports", icon: "⚽" },
  { name: "Food", icon: "🍔" },
  { name: "Museum", icon: "🖼️" },
  { name: "Community Meetup", icon: "🤝" },
  { name: "Adaptive Sports", icon: "♿" },
  { name: "Festival", icon: "🎪" },
  { name: "Gaming", icon: "🎮" },
  { name: "Art", icon: "🎨" },
  { name: "Education", icon: "📚" },
];

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Peyton",
  "Cameron", "Reese", "Skyler", "Dakota", "Emerson", "Rowan", "Sage", "Elliot", "Kendall", "Hayden",
  "Priya", "Wei", "Fatima", "Diego", "Noor", "Kwame", "Yuki", "Camila", "Aiden", "Sofia",
];
const LAST_NAMES = [
  "Nguyen", "Garcia", "Smith", "Johnson", "Patel", "Kim", "Martinez", "Brown", "Davis", "Lopez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "White",
];

const ORG_NAMES = [
  "Waco Accessible Arts Collective",
  "Austin Adaptive Sports League",
  "Dallas Community Music Hall",
  "Houston Sensory-Friendly Festivals",
  "Central Texas Food & Culture Co-op",
  "Lone Star Gaming Alliance",
  "Blue Bonnet Museum Network",
  "OnTheSpot Demo Organization",
];

const EVENT_TEMPLATES: { title: string; category: string; description: string }[] = [
  { title: "Sensory-Friendly Indie Rock Night", category: "Concert", description: "A low-volume, reduced-lighting concert featuring local indie bands. Quiet room available throughout the show." },
  { title: "Wheelchair Basketball Showcase", category: "Adaptive Sports", description: "Watch competitive wheelchair basketball with ASL interpretation and accessible seating throughout the arena." },
  { title: "Stand-Up Comedy: Open Captioned Show", category: "Comedy", description: "A night of stand-up comedy with live open captioning and assistive listening devices available at the door." },
  { title: "Downtown Food Truck Festival", category: "Food", description: "Dozens of local food trucks gather for an afternoon of tastings, live music, and family activities." },
  { title: "Hands-On History Museum Tour", category: "Museum", description: "A docent-led tour with tactile exhibits, braille signage, and audio description available on request." },
  { title: "Neighbors Night: Community Potluck", category: "Community Meetup", description: "Bring a dish and meet your neighbors at this monthly potluck and resource fair." },
  { title: "Adaptive Yoga in the Park", category: "Adaptive Sports", description: "A gentle, chair-friendly yoga session led by a certified adaptive fitness instructor." },
  { title: "Fall Arts & Crafts Festival", category: "Festival", description: "Browse work from over 50 local artists, with wide pathways and accessible restrooms throughout the fairground." },
  { title: "Retro Arcade & Tabletop Gaming Night", category: "Gaming", description: "Low-sensory arcade hours plus tabletop games, with a dedicated quiet room for breaks." },
  { title: "Community Mural Painting Day", category: "Art", description: "Help paint a community mural — all skill levels welcome, with seated painting stations available." },
  { title: "Accessible Tech for Everyday Life Workshop", category: "Education", description: "A hands-on workshop covering screen readers, voice control, and assistive tech, captioned live." },
  { title: "Jazz Under the Stars", category: "Concert", description: "An outdoor evening jazz concert on the lawn, with accessible parking and golf-cart shuttle service." },
  { title: "Improv Comedy for All Abilities", category: "Comedy", description: "An interactive improv show designed to be welcoming for neurodivergent audiences, with a low-noise commitment." },
  { title: "Farmers Market Cooking Demo", category: "Food", description: "Local chefs demonstrate seasonal recipes using ingredients from the farmers market, with printed large-text recipe cards." },
  { title: "Contemporary Art Opening Reception", category: "Art", description: "Opening night for a new contemporary art exhibit, with a quiet preview hour before doors open to the public." },
  { title: "Youth Adaptive Soccer Clinic", category: "Adaptive Sports", description: "A free clinic teaching soccer fundamentals adapted for a range of mobility and sensory needs." },
  { title: "Board Game Café Meetup", category: "Gaming", description: "Weekly meetup at a cozy board game café with reserved low-noise tables and companion seating." },
  { title: "Storytime & Sensory Play for Families", category: "Family", description: "A gentle storytime session with sensory play stations for kids of all abilities." },
  { title: "Craft Beer & Live Music Festival", category: "Festival", description: "A weekend festival featuring local breweries and live bands across two accessible stages." },
  { title: "Poetry Open Mic Night", category: "Community Meetup", description: "Share your work or just listen at this welcoming, low-key open mic with ASL interpretation on request." },
  { title: "Planetarium Accessible Viewing Night", category: "Education", description: "A special planetarium show with reduced flashing effects and audio-described narration." },
  { title: "Community 5K Fun Run & Roll", category: "Sports", description: "A fully accessible 5K route open to runners, walkers, and wheelchair users alike." },
  { title: "Vintage Vinyl & Record Swap", category: "Music", description: "Browse and trade vinyl records with fellow collectors in a relaxed, low-crowd setting." },
  { title: "Watercolor Painting for Beginners", category: "Art", description: "A beginner-friendly watercolor class with adaptive brushes and seated workstations available." },
  { title: "Trivia Night: Movies & TV", category: "Community Meetup", description: "Weekly trivia night with a quiet corner reserved for anyone needing a lower-stimulation space." },
  { title: "Outdoor Cinema Under the Stars", category: "Festival", description: "A free outdoor movie screening with captions displayed on-screen and accessible parking nearby." },
  { title: "Cultural Food Festival", category: "Food", description: "Sample dishes from a dozen cultures at this family-friendly festival with shaded seating throughout." },
  { title: "Museum After Hours: Quiet Access Evening", category: "Museum", description: "A dedicated low-sensory evening at the museum with dimmed lighting and reduced crowd caps." },
  { title: "Esports Tournament: Community Cup", category: "Gaming", description: "A local esports tournament open to all skill levels, with accessible controllers available to borrow." },
  { title: "Fall Harvest Community Fair", category: "Community Meetup", description: "A neighborhood fair with games, food, and live music — step-free throughout the venue." },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding OnTheSpot demo data…");

  // Running as part of a Vercel build (see vercel.json's buildCommand)? Only
  // seed an empty database — never wipe real data on a redeploy. Local
  // `npm run db:seed` runs outside Vercel and keeps its existing
  // wipe-and-reseed behavior for iterative dev.
  if (process.env.VERCEL) {
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      console.log("Data already present — skipping seed (Vercel build).");
      await db.$disconnect();
      return;
    }
  }

  console.log("Clearing existing data…");
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.moderationAction.deleteMany(),
    db.report.deleteMany(),
    db.eventAnalytics.deleteMany(),
    db.featuredPlacement.deleteMany(),
    db.payment.deleteMany(),
    db.subscription.deleteMany(),
    db.rSVP.deleteMany(),
    db.savedEvent.deleteMany(),
    db.follow.deleteMany(),
    db.eventImage.deleteMany(),
    db.eventAccessibility.deleteMany(),
    db.eventCategory.deleteMany(),
    db.event.deleteMany(),
    db.organizationVerification.deleteMany(),
    db.organizationMember.deleteMany(),
    db.organization.deleteMany(),
    db.category.deleteMany(),
    db.accessibilityPreference.deleteMany(),
    db.passwordResetToken.deleteMany(),
    db.emailVerificationToken.deleteMany(),
    db.userProfile.deleteMany(),
    db.user.deleteMany(),
    db.platformSetting.deleteMany(),
  ]);

  // --- Platform settings -----------------------------------------------
  await db.platformSetting.createMany({
    data: [
      { key: "partnerPremiumPriceCents", value: { cents: 4999 } },
      { key: "userPremiumPriceCents", value: { cents: 499 } },
      { key: "featuredEventPriceCentsPerWeek", value: { cents: 9900 } },
    ],
  });

  // --- Categories ---------------------------------------------------------
  const categories = await Promise.all(
    CATEGORY_DEFS.map((c) =>
      db.category.create({ data: { name: c.name, slug: slugify(c.name), icon: c.icon } }),
    ),
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c]));
  console.log(`Created ${categories.length} categories`);

  // --- Demo accounts --------------------------------------------------
  const DEMO_PASSWORD = "OnTheSpot123!";
  const demoPasswordHash = await hash(DEMO_PASSWORD);

  const adminUser = await db.user.create({
    data: {
      name: "Ada Administrator",
      email: "admin@onthespot.demo",
      passwordHash: demoPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      profile: { create: { username: "ada-admin", city: "Waco", state: "TX", zip: "76701", onboardedAt: new Date() } },
    },
  });

  const demoUser = await db.user.create({
    data: {
      name: "Uma User",
      email: "user@onthespot.demo",
      passwordHash: demoPasswordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: new Date(),
      profile: {
        create: {
          username: "uma-user",
          city: "Waco",
          state: "TX",
          zip: "76701",
          latitude: CITIES[0].lat,
          longitude: CITIES[0].lng,
          interests: [Interest.MUSIC, Interest.COMMUNITY, Interest.ARTS, Interest.GAMING],
          onboardedAt: new Date(),
        },
      },
      accessibilityPreferences: {
        create: [
          { feature: "WHEELCHAIR_ACCESSIBLE" },
          { feature: "ACCESSIBLE_RESTROOM" },
          { feature: "COMPANION_SEATING" },
          { feature: "SERVICE_ANIMALS_ALLOWED" },
          { feature: "LOW_NOISE_ENVIRONMENT" },
          { feature: "SENSORY_FRIENDLY" },
        ],
      },
      subscription: { create: { tier: "USER_PREMIUM", status: "ACTIVE" } },
    },
  });

  const demoPartnerUser = await db.user.create({
    data: {
      name: "Pat Partner",
      email: "partner@onthespot.demo",
      passwordHash: demoPasswordHash,
      role: "PARTNER",
      status: "ACTIVE",
      emailVerified: new Date(),
      profile: { create: { username: "pat-partner", city: "Waco", state: "TX", zip: "76701", onboardedAt: new Date() } },
    },
  });

  console.log("Created demo accounts: admin@onthespot.demo, user@onthespot.demo, partner@onthespot.demo");

  // --- Regular users (20 total incl. demo user) ---------------------------
  const regularUsers = [demoUser];
  for (let i = 0; i < 19; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const homeCity = pick(CITIES);
    const user = await db.user.create({
      data: {
        name: `${first} ${last}`,
        email: `${slugify(first)}.${slugify(last)}${i}@onthespot.demo`,
        passwordHash: demoPasswordHash,
        role: "USER",
        status: Math.random() < 0.05 ? "SUSPENDED" : "ACTIVE",
        emailVerified: Math.random() < 0.8 ? new Date() : null,
        profile: {
          create: {
            username: `${slugify(first)}-${slugify(last)}-${i}`,
            city: homeCity.city,
            state: homeCity.state,
            zip: "00000",
            latitude: jitter(homeCity.lat, 8),
            longitude: jitter(homeCity.lng, 8),
            interests: pickMany(Object.values(Interest), randomInt(2, 5)),
            onboardedAt: Math.random() < 0.85 ? new Date() : null,
          },
        },
        accessibilityPreferences:
          Math.random() < 0.6
            ? { create: pickMany(ALL_FEATURES, randomInt(1, 6)).map((feature) => ({ feature })) }
            : undefined,
        subscription: { create: { tier: "FREE", status: "ACTIVE" } },
      },
    });
    regularUsers.push(user);
  }
  console.log(`Created ${regularUsers.length} regular users`);

  // --- Organizations (8 total, first owned by demo partner) ---------------
  const organizations: { id: string; slug: string; ownerId: string }[] = [];
  for (let i = 0; i < ORG_NAMES.length; i++) {
    const name = ORG_NAMES[i];
    const homeCity = pick(CITIES);
    const isDemo = i === ORG_NAMES.length - 1;
    const ownerUser = isDemo
      ? demoPartnerUser
      : await db.user.create({
          data: {
            name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
            email: `owner${i}@onthespot.demo`,
            passwordHash: demoPasswordHash,
            role: "PARTNER",
            status: "ACTIVE",
            emailVerified: new Date(),
            profile: { create: { username: `org-owner-${i}`, city: homeCity.city, state: homeCity.state, zip: "00000", onboardedAt: new Date() } },
          },
        });

    const verificationStatus = i % 3 === 0 ? "VERIFIED" : i % 3 === 1 ? "PENDING" : "UNVERIFIED";
    const org = await db.organization.create({
      data: {
        name,
        slug: slugify(name),
        description: `${name} hosts inclusive, accessibility-first events across the ${homeCity.city} area.`,
        contactEmail: ownerUser.email,
        website: `https://example.com/${slugify(name)}`,
        city: homeCity.city,
        state: homeCity.state,
        zip: "00000",
        latitude: homeCity.lat,
        longitude: homeCity.lng,
        verificationStatus,
        members: { create: { userId: ownerUser.id, role: "OWNER" } },
        subscription: { create: { tier: isDemo ? "PARTNER_PREMIUM" : "FREE", status: "ACTIVE" } },
        ...(verificationStatus !== "UNVERIFIED"
          ? {
              verification: {
                create: {
                  legalName: `${name} LLC`,
                  taxId: `74-${randomInt(1000000, 9999999)}`,
                  status: verificationStatus,
                  submittedAt: new Date(),
                  reviewedAt: verificationStatus === "VERIFIED" ? new Date() : null,
                  reviewedById: verificationStatus === "VERIFIED" ? adminUser.id : null,
                },
              },
            }
          : {}),
      },
    });
    organizations.push({ id: org.id, slug: org.slug, ownerId: ownerUser.id });
  }
  console.log(`Created ${organizations.length} organizations`);

  // --- Events (30 total) ---------------------------------------------------
  const STATUS_ROLL = [
    ...Array(20).fill("PUBLISHED"),
    ...Array(5).fill("PENDING_REVIEW"),
    ...Array(2).fill("APPROVED"),
    ...Array(2).fill("REJECTED"),
    ...Array(1).fill("CANCELLED"),
  ] as const;

  const createdEvents: { id: string; slug: string; organizationId: string | null; status: string }[] = [];

  for (let i = 0; i < 30; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const homeCity = pick(CITIES);
    const org = Math.random() < 0.8 ? pick(organizations) : null;
    const creatorId = org ? org.ownerId : pick(regularUsers).id;
    const status = STATUS_ROLL[i % STATUS_ROLL.length];
    const accessibilityProfile = pick(["high", "medium", "low"] as const);
    const daysOffset = randomInt(-10, 60);
    const start = new Date();
    start.setDate(start.getDate() + daysOffset);
    start.setHours(randomInt(9, 20), pick([0, 15, 30, 45]), 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + randomInt(1, 4));

    const title = `${template.title} — ${homeCity.city}`;
    const slug = `${slugify(title)}-${i}`;

    const isFree = Math.random() < 0.55;

    const event = await db.event.create({
      data: {
        slug,
        title,
        description: template.description,
        organizationId: org?.id ?? null,
        createdById: creatorId,
        status,
        rejectionReason: status === "REJECTED" ? "Accessibility information was incomplete. Please confirm restroom and seating details." : null,
        startAt: start,
        endAt: end,
        venueName: `${homeCity.city} ${pick(["Community Hall", "Civic Center", "Amphitheater", "Convention Center", "Arts Pavilion", "Park Pavilion"])}`,
        addressLine1: `${randomInt(100, 9999)} ${pick(["Main St", "5th Ave", "Congress Ave", "Elm St", "Riverside Dr", "Franklin Ave"])}`,
        city: homeCity.city,
        state: homeCity.state,
        zip: "00000",
        latitude: jitter(homeCity.lat, 6),
        longitude: jitter(homeCity.lng, 6),
        indoorOutdoor: pick(["INDOOR", "OUTDOOR", "BOTH"] as const),
        isFree,
        price: isFree ? null : randomInt(5, 75),
        ticketUrl: isFree ? null : "https://example.com/tickets",
        minAge: Math.random() < 0.2 ? 18 : null,
        coverImageUrl: `/seed/event-${i % 20}.svg`,
        accessibilityContactName: org ? "Accessibility Team" : null,
        accessibilityContactEmail: org ? "access@example.com" : null,
        accessibilityContactPhone: org ? "555-010-0100" : null,
        accessibilityLastVerifiedAt: new Date(),
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        isFeatured: false,
        viewCount: randomInt(20, 4000),
        categories: {
          create: [{ categoryId: (categoryByName.get(template.category) ?? categories[0]).id }],
        },
        accessibility: { create: randomAccessibilityAnswers(accessibilityProfile) },
        images: { create: [{ url: `/seed/event-${i % 20}.svg`, position: 0 }] },
      },
    });
    createdEvents.push({ id: event.id, slug: event.slug, organizationId: event.organizationId, status: event.status });
  }
  console.log(`Created ${createdEvents.length} events`);

  // Feature two published events and record a paid placement + payment.
  const publishedEvents = createdEvents.filter((e) => e.status === "PUBLISHED" && e.organizationId);
  for (const event of pickMany(publishedEvents, Math.min(2, publishedEvents.length))) {
    const endAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.event.update({ where: { id: event.id }, data: { isFeatured: true, featuredUntil: endAt } });
    await db.featuredPlacement.create({
      data: {
        eventId: event.id,
        organizationId: event.organizationId!,
        startAt: new Date(),
        endAt,
        amountCents: 9900,
        status: "SUCCEEDED",
      },
    });
    await db.payment.create({
      data: { organizationId: event.organizationId!, amountCents: 9900, status: "SUCCEEDED", description: "Featured placement" },
    });
  }

  // --- RSVPs, saves, follows ------------------------------------------
  for (const event of createdEvents.filter((e) => e.status === "PUBLISHED")) {
    const rsvpCount = randomInt(0, 12);
    const rsvpUsers = pickMany(regularUsers, Math.min(rsvpCount, regularUsers.length));
    for (const user of rsvpUsers) {
      await db.rSVP.create({
        data: { eventId: event.id, userId: user.id, status: pick(["GOING", "GOING", "GOING", "INTERESTED"] as const) },
      });
    }
    if (Math.random() < 0.4) {
      for (const user of pickMany(regularUsers, randomInt(0, 5))) {
        await db.savedEvent.create({ data: { eventId: event.id, userId: user.id } }).catch(() => {});
      }
    }
  }

  for (const org of organizations) {
    for (const user of pickMany(regularUsers, randomInt(0, 8))) {
      await db.follow.create({ data: { followerId: user.id, organizationId: org.id } }).catch(() => {});
    }
  }
  console.log("Seeded RSVPs, saves, and follows");

  // --- Reports ------------------------------------------------------------
  const REPORT_REASONS = ["INCORRECT_ACCESSIBILITY", "WRONG_LOCATION", "DUPLICATE", "OTHER"] as const;
  for (const event of pickMany(publishedEvents, Math.min(4, publishedEvents.length))) {
    await db.report.create({
      data: {
        reporterId: pick(regularUsers).id,
        eventId: event.id,
        reason: pick(REPORT_REASONS),
        details: "Flagging this for the moderation team to double check.",
        status: "OPEN",
      },
    });
  }
  console.log("Seeded reports");

  // --- Event analytics (30 days of history for published events) ----------
  for (const event of createdEvents.filter((e) => e.status === "PUBLISHED")) {
    const rows = [];
    for (let d = 29; d >= 0; d--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - d);
      const views = randomInt(0, 60);
      rows.push({
        eventId: event.id,
        date,
        views,
        uniqueVisitors: Math.round(views * 0.8),
        rsvps: randomInt(0, Math.max(1, Math.round(views * 0.15))),
        saves: randomInt(0, Math.max(1, Math.round(views * 0.1))),
        profileViews: randomInt(0, 10),
      });
    }
    await db.eventAnalytics.createMany({ data: rows });
  }
  console.log("Seeded 30 days of analytics history");

  // --- Audit log seed entry ------------------------------------------------
  await db.auditLog.create({
    data: { actorId: adminUser.id, action: "SEED_COMPLETED", entityType: "SYSTEM", entityId: "seed", metadata: { at: new Date().toISOString() } },
  });

  console.log("\nSeed complete!");
  console.log("Demo accounts (development only):");
  console.log(`  Admin:   admin@onthespot.demo   / ${DEMO_PASSWORD}`);
  console.log(`  Partner: partner@onthespot.demo / ${DEMO_PASSWORD}`);
  console.log(`  User:    user@onthespot.demo    / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
