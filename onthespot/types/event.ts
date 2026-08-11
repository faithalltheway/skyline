import type { AccessibilityFeature, AccessibilityState, EventStatus, IndoorOutdoor } from "@prisma/client";

export interface EventCardData {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  startAt: Date;
  endAt: Date;
  venueName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isFree: boolean;
  price: string | null;
  isFeatured: boolean;
  status: EventStatus;
  hostName: string;
  hostVerified: boolean;
  hostSlug: string | null;
  distanceMiles: number | null;
  matchPercent: number;
  matchSummary: string;
  goingCount: number;
  categoryNames: string[];
}

export interface AccessibilityRow {
  feature: AccessibilityFeature;
  state: AccessibilityState;
  note: string | null;
}

export interface EventDetailData extends EventCardData {
  description: string;
  addressLine1: string;
  zip: string;
  indoorOutdoor: IndoorOutdoor;
  ticketUrl: string | null;
  minAge: number | null;
  maxAge: number | null;
  accessibilityContactName: string | null;
  accessibilityContactEmail: string | null;
  accessibilityContactPhone: string | null;
  accessibilityLastVerifiedAt: Date | null;
  accessibility: AccessibilityRow[];
  images: { id: string; url: string; altText: string | null }[];
  organizationSlug: string | null;
  organizationId: string | null;
  createdById: string;
  interestedCount: number;
}
