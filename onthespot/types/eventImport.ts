export interface NormalizedImportedEvent {
  externalId: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  venueName: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  isFree: boolean;
  price: number | null;
  ticketUrl: string | null;
  coverImageUrl: string | null;
  categorySlug: string | null;
}
