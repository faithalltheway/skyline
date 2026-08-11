import Link from "next/link";
import Image from "next/image";
import type { EventCardData } from "@/types/event";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatDateRange, formatDistance, formatPrice } from "@/lib/utils";
import { matchLabel } from "@/lib/matching";
import { SaveEventButton } from "@/components/events/SaveEventButton";

export function EventCard({ event, saved = false }: { event: EventCardData; saved?: boolean }) {
  const { label: matchTone } = matchLabel(event.matchPercent);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Icon name="pin" size={32} />
          </div>
        )}
        {event.isFeatured && (
          <Badge tone="accent" className="absolute left-3 top-3">
            <Icon name="star" size={12} /> Featured
          </Badge>
        )}
        <div className="absolute right-3 top-3">
          <SaveEventButton eventId={event.id} initialSaved={saved} compact />
        </div>
      </div>

      <Link href={`/events/${event.slug}`} className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Badge tone={event.matchPercent >= 80 ? "confirmed" : event.matchPercent >= 50 ? "unknown" : "neutral"}>
            {event.matchPercent}% match
          </Badge>
          {event.hostVerified && (
            <Badge tone="brand">
              <Icon name="shield" size={12} /> Verified
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-foreground">{event.title}</h3>
        <p className="text-sm text-neutral-500">{formatDateRange(event.startAt, event.endAt)}</p>
        <p className="flex items-center gap-1 text-sm text-neutral-500">
          <Icon name="pin" size={14} />
          {event.venueName} · {event.city}, {event.state}
        </p>
        <p className="text-xs text-neutral-500">{event.matchSummary} · {matchTone.toLowerCase()}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="font-bold text-brand-700 dark:text-brand-300">
            {formatPrice(event.isFree, event.price)}
          </span>
          <span className="flex items-center gap-1 text-neutral-500">
            {event.distanceMiles != null && (
              <>
                <Icon name="map" size={14} />
                {formatDistance(event.distanceMiles)}
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          Hosted by {event.hostName} · {event.goingCount} going
        </p>
      </Link>
    </div>
  );
}
