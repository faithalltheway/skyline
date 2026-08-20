CREATE TYPE "EventSource" AS ENUM ('GOOGLE_EVENTS');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" "EventSource";

-- CreateIndex
CREATE UNIQUE INDEX "Event_externalSource_externalId_key" ON "Event"("externalSource", "externalId");

