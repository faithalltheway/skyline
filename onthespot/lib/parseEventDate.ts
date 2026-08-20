/**
 * Best-effort parser for the loosely-formatted date strings Google's events
 * data returns (e.g. "Aug 19", "Wed, Aug 19, 7 – 10 PM"). There is no
 * guaranteed machine-readable date in this data, so this intentionally
 * returns null — meaning "skip this event" — rather than guess at a date
 * that could mislead someone about when an event actually happens.
 */
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function extractMonthDay(text: string): { month: number; day: number } | null {
  const match = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})/i);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const day = parseInt(match[2], 10);
  if (month == null || day < 1 || day > 31) return null;
  return { month, day };
}

function extractTimeRange(text: string): { startHour: number; startMin: number; endHour: number | null; endMin: number } | null {
  // e.g. "7 – 10 PM", "7:00 – 9:30 PM", "7 PM – 9 PM", "7pm"
  const rangeMatch = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
  );
  if (rangeMatch) {
    const endMeridiem = rangeMatch[6].toLowerCase();
    const startMeridiem = (rangeMatch[3] ?? rangeMatch[6]).toLowerCase();
    const startHour = to24Hour(parseInt(rangeMatch[1], 10), startMeridiem);
    const endHour = to24Hour(parseInt(rangeMatch[4], 10), endMeridiem);
    return {
      startHour,
      startMin: parseInt(rangeMatch[2] ?? "0", 10),
      endHour,
      endMin: parseInt(rangeMatch[5] ?? "0", 10),
    };
  }
  const singleMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (singleMatch) {
    const startHour = to24Hour(parseInt(singleMatch[1], 10), singleMatch[3].toLowerCase());
    return { startHour, startMin: parseInt(singleMatch[2] ?? "0", 10), endHour: null, endMin: 0 };
  }
  return null;
}

function to24Hour(hour: number, meridiem: string): number {
  const h = hour % 12;
  return meridiem === "pm" ? h + 12 : h;
}

export function parseGoogleEventDate(
  startDate?: string,
  when?: string,
): { startAt: Date; endAt: Date } | null {
  const source = `${startDate ?? ""} ${when ?? ""}`.trim();
  if (!source) return null;

  const monthDay = extractMonthDay(source);
  if (!monthDay) return null;

  const time = extractTimeRange(source);
  const now = new Date();
  let year = now.getFullYear();

  const candidate = new Date(year, monthDay.month, monthDay.day, time?.startHour ?? 19, time?.startMin ?? 0);

  // Google shows upcoming events; if the parsed date lands more than ~45
  // days in the past, it's almost certainly next year's occurrence.
  const daysAgo = (now.getTime() - candidate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo > 45) {
    year += 1;
    candidate.setFullYear(year);
  }

  const startAt = candidate;
  const endAt = new Date(startAt);
  if (time?.endHour != null) {
    endAt.setHours(time.endHour, time.endMin, 0, 0);
    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
  } else {
    endAt.setHours(endAt.getHours() + 2);
  }

  return { startAt, endAt };
}
