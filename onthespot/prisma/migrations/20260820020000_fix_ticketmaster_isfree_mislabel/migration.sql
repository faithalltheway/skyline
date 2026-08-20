-- Ticketmaster is a ticketing platform; when it doesn't return a priceRanges
-- entry that means pricing data is unavailable, not that the event is free.
-- The importer (lib/ticketmaster.ts) previously set isFree=true in that case,
-- mislabeling paid events as free. Correct any rows already imported before
-- the fix landed. Safe to re-run: it only touches rows still in that state.
UPDATE "Event"
SET "isFree" = false
WHERE "externalSource" = 'TICKETMASTER'
  AND "isFree" = true
  AND "price" IS NULL;
