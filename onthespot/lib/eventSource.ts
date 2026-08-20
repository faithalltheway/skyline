import type { EventSource } from "@prisma/client";

export const EVENT_SOURCE_LABEL: Record<EventSource, string> = {
  GOOGLE_EVENTS: "Google Events",
  TICKETMASTER: "Ticketmaster",
  PREDICTHQ: "PredictHQ",
};
