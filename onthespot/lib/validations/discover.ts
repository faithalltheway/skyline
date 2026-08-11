import { z } from "zod";
import { AccessibilityFeature, IndoorOutdoor } from "@prisma/client";

export const discoverFilterSchema = z.object({
  q: z.string().trim().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().default(25),
  categories: z.array(z.string()).default([]),
  accessibility: z.array(z.nativeEnum(AccessibilityFeature)).default([]),
  matchAll: z.coerce.boolean().default(false),
  price: z.enum(["any", "free", "paid"]).default("any"),
  indoorOutdoor: z.enum(["ANY", ...Object.values(IndoorOutdoor)] as [string, ...string[]]).default("ANY"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(["match", "date", "distance"]).default("match"),
  page: z.coerce.number().min(1).default(1),
});

export type DiscoverFilters = z.infer<typeof discoverFilterSchema>;

export function parseDiscoverSearchParams(sp: Record<string, string | string[] | undefined>): DiscoverFilters {
  const toArray = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
  return discoverFilterSchema.parse({
    q: sp.q,
    lat: sp.lat,
    lng: sp.lng,
    radius: sp.radius,
    categories: toArray(sp.categories),
    accessibility: toArray(sp.accessibility),
    matchAll: sp.matchAll === "true" || sp.matchAll === "1",
    price: sp.price,
    indoorOutdoor: sp.indoorOutdoor,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    sort: sp.sort,
    page: sp.page,
  });
}
