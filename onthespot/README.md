# OnTheSpot

**OnTheSpot** is an accessibility-first event and activity discovery platform. It helps people find nearby events and activities that match their specific accessibility, mobility, sensory, and accommodation needs — and gives hosts (individuals and organizations) the tools to publish structured, trustworthy accessibility information instead of a paragraph of free text.

This is a full-stack MVP: real database, real authentication, real authorization, a working accessibility matching engine, an interactive map, RSVP/save/follow systems, multi-step event creation wizards, a Partner dashboard with analytics, an Admin dashboard with a full moderation workflow, and an automated Google Events import pipeline that feeds new candidate listings into that same moderation queue.

---

## 1. Technology stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js Server Actions + Route Handlers, service/repository layers |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | Auth.js / NextAuth v5 (credentials provider, JWT sessions) |
| Maps | Mapbox GL JS (with a graceful no-token fallback) |
| Payments | Stripe (Checkout + webhooks; falls back to a "demo mode" grant when no keys are configured) |
| Image storage | Cloudinary if configured, otherwise a local filesystem upload fallback |
| Testing | Vitest, Testing Library, jest-axe |

## 2. Project architecture

```
/app                  Next.js App Router routes
  /(auth)             Login, register, password reset, email verify — simple centered layout
  /(main)             Discover, map, event detail, RSVPs, saved, profile, onboarding — app shell w/ nav
  /admin              Admin dashboard (sidebar layout), gated by role
  /partner            Partner dashboard (sidebar layout), gated by organization membership
  /api                Route handlers: NextAuth, file upload, Stripe webhook, nearby-events JSON
/actions              Cross-cutting server actions (RSVP/save/follow, reports)
/components
  /ui                 Design-system primitives (Button, Field, Modal, Badge, ...)
  /layout             App shell, nav, dashboard shell
  /events, /map, /organizations, /discover, /partner, /admin  Feature components
/lib                  Framework-agnostic helpers: db client, auth config helpers, accessibility
                       metadata, matching engine, geo/haversine, validation schemas (Zod), settings
/services             Business logic (event search, moderation, billing, analytics, engagement)
/repositories         Thin Prisma query builders (currently: events)
/prisma               schema.prisma, migrations, seed.ts
/tests                Vitest unit, integration (against a real Postgres test DB), and axe a11y tests
```

Route protection is layered:
1. **`middleware.ts`** — authentication gate (redirects unauthenticated users) and coarse role gate for `/admin`.
2. **`lib/authz.ts`** (`requireUser`, `requireRole`, `requireOrganization`) — the authoritative, server-side check called at the top of every protected page and Server Action. Partner access is checked by real `OrganizationMember` rows, not just the JWT role claim, so a same-session role upgrade (e.g. "Become a partner") takes effect immediately.

## 3. Database schema summary

Core tables (see `prisma/schema.prisma` for the full definition with enums, indexes, and constraints):

- **Identity**: `User`, `UserProfile`, `AccessibilityPreference`, `PasswordResetToken`, `EmailVerificationToken`
- **Organizations**: `Organization`, `OrganizationMember`, `OrganizationVerification`
- **Events**: `Event`, `EventAccessibility` (structured CONFIRMED / NOT_AVAILABLE / UNKNOWN per feature — never free text), `EventImage`, `Category`, `EventCategory`
- **Engagement**: `RSVP`, `SavedEvent`, `Follow`
- **Trust & safety**: `Report`, `ModerationAction`, `AuditLog`
- **Monetization**: `Subscription`, `Payment`, `FeaturedPlacement`, `PlatformSetting` (admin-configurable prices)
- **Analytics**: `EventAnalytics` (daily views/RSVPs/saves per event)

28 accessibility features across 5 categories (Mobility, Sensory, Hearing, Vision, Additional) are defined once in `lib/accessibility.ts` and reused everywhere: the onboarding wizard, event creation wizards, filters, and the accessibility-match engine (`lib/matching.ts`), which **never treats an unconfirmed feature as a match**.

## 4. Environment variables

Copy `.env.example` to `.env` and fill in what you have. Everything not listed below has a working fallback so the app is fully usable without any external API keys.

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes (dev) | `http://localhost:3000` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Without it, map views show a graceful fallback with a "Get directions" link |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Without it, subscription/featured-placement "purchases" activate immediately in demo mode instead of opening Stripe Checkout |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | No | Without it, image uploads are written to `/public/uploads` |
| `NEXT_PUBLIC_APP_URL` | Yes | Used to build absolute links (share links, Stripe redirect URLs) |

## 5. Local setup

### Prerequisites
- Node.js 20+
- A PostgreSQL 14+ database

### Install & configure

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL to a real Postgres database
```

### Database

```bash
npx prisma migrate dev   # creates the schema
npm run db:seed          # seeds demo data (see below) — also runs automatically after `migrate reset`
```

### Run the app

```bash
npm run dev
# open http://localhost:3000
```

## 6. Demo accounts (development only)

The seed script creates three demo accounts. **These credentials are for local development only — never use them in a production deployment.**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@onthespot.demo` | `OnTheSpot123!` |
| Partner | `partner@onthespot.demo` | `OnTheSpot123!` |
| User | `user@onthespot.demo` | `OnTheSpot123!` |

The seed also creates ~28 additional users, 8 organizations (with varying verification states), and 30 events across Waco, Austin, Dallas, and Houston, TX, with a realistic spread of accessibility completeness (some fully confirmed, some largely unknown) and moderation statuses (published, pending review, approved-not-yet-published, rejected, cancelled) so every workflow in the app has something to show.

## 7. Testing

```bash
npm test          # unit + integration + accessibility (axe) tests, via Vitest
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

Integration tests run against a **separate** Postgres database so they never touch your dev data:

```bash
createdb onthespot_test
DATABASE_URL="postgresql://user:pass@localhost:5432/onthespot_test" npx prisma migrate deploy
npm test
```

(`vitest.config.ts` already points `DATABASE_URL` at `onthespot_test` on `localhost:5432` — adjust it if your local Postgres differs.)

## 8. Production build

```bash
npm run build
npm run start
```

## 9. Deployment guidance

- **App**: Deploy to Vercel (or any Node host). Set all environment variables from `.env.example` in the hosting provider's dashboard.
- **Database**: Use a managed Postgres provider (Neon, Supabase, RDS). Run `npx prisma migrate deploy` as part of your deploy pipeline — do **not** use `migrate dev` in production.
- **Stripe**: Point `STRIPE_WEBHOOK_SECRET` at a webhook endpoint subscribed to `checkout.session.completed`, pointed at `/api/webhooks/stripe`.
- **Images**: Configure Cloudinary in production — the local-filesystem upload fallback does not persist across serverless deployments.

## 10. What's implemented vs. Phase 2

**Implemented**: everything in the product brief — auth & onboarding, accessibility matching, discovery + filtering, interactive map with clustering, RSVP/save/follow, community + partner event creation wizards with mandatory structured accessibility data, partner dashboard + analytics (charts, CSV export), full admin dashboard (moderation queue with approve/reject/request-changes, user & partner management, reports queue, revenue, audit log, configurable pricing), Stripe-ready monetization, seed data, and a test suite (unit, integration, and automated accessibility checks via axe).

## 11. Google Events import (built, currently disabled by default)

`/admin/system` has a "Google Events import" panel that calls `/api/cron/import-events`, which queries [SerpApi's Google Events engine](https://serpapi.com) for Waco/Austin/Dallas/Houston. For each new result it would:

- Skip it if already imported (deduped on `(externalSource, externalId)`)
- Skip it if the date can't be confidently parsed — Google's event dates are loosely formatted text, not machine-readable, and a wrong date is worse than no import
- Create it as `PENDING_REVIEW` with **every** accessibility feature set to `UNKNOWN` (never guessed) — it would land in the same moderation queue as any other submission, clearly tagged "Imported from Google Events," and never reach Discover until a moderator reviews it
- Attribute it to a dedicated non-login system account (`imports@onthespot.internal`) rather than a real user

**Status**: in testing, Google's Events search feature reliably returned zero results for requests from non-residential/proxy IPs — including from a paid SerpApi plan — because that feature depends on fine-grained real-device location signals, not just IP country. There's no automatic (Vercel Cron) trigger configured as a result, to avoid spending API credits on empty responses; the manual "Sync now" button in `/admin/system` is still available if you want to retest later (e.g. with a different provider or a residential-proxy setup). Manual event creation (`/events/create` for community events, `/partner/events/new` for organizations) is the primary way events get added for now.

Requires `SERPAPI_KEY`; optionally `CRON_SECRET` if you re-enable a scheduled trigger later (add a `crons` block back to `vercel.json`).

## 12. Phase 2 recommendations

- Real transactional email (verification, password reset, RSVP confirmations) — currently these flows work but surface their links directly in the UI in development instead of sending mail, since no email provider is configured.
- Real geocoding (the app ships a small static lookup for the four seeded Texas metros; a live geocoder would generalize this to any address).
- Recurring event instance generation from `recurrenceRule` (currently stored as a plain-language description).
- Rate limiting on public mutation endpoints (report submission, RSVP) for abuse resistance at scale.
- A real notification system (in-app + email) for moderation decisions, RSVP reminders, and follow activity.
- Multi-organization-member roles beyond OWNER (the schema already supports MANAGER/STAFF; the UI to manage them is not yet built).
