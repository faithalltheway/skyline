import { db } from "./db";

export const DEFAULT_PLATFORM_SETTINGS = {
  partnerPremiumPriceCents: 4999,
  userPremiumPriceCents: 499,
  featuredEventPriceCentsPerWeek: 9900,
} as const;

export type PlatformSettingsKey = keyof typeof DEFAULT_PLATFORM_SETTINGS;

/** Reads a numeric platform setting (e.g. a configurable price), falling back to the built-in default. */
export async function getPlatformSetting(key: PlatformSettingsKey): Promise<number> {
  const row = await db.platformSetting.findUnique({ where: { key } });
  if (!row) return DEFAULT_PLATFORM_SETTINGS[key];
  const value = row.value as { cents?: number };
  return typeof value?.cents === "number" ? value.cents : DEFAULT_PLATFORM_SETTINGS[key];
}

export async function getAllPlatformSettings(): Promise<Record<PlatformSettingsKey, number>> {
  const keys = Object.keys(DEFAULT_PLATFORM_SETTINGS) as PlatformSettingsKey[];
  const rows = await db.platformSetting.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((r) => [r.key, (r.value as { cents?: number })?.cents]));
  return Object.fromEntries(
    keys.map((k) => [k, byKey.get(k) ?? DEFAULT_PLATFORM_SETTINGS[k]]),
  ) as Record<PlatformSettingsKey, number>;
}

export async function setPlatformSetting(key: PlatformSettingsKey, cents: number) {
  await db.platformSetting.upsert({
    where: { key },
    update: { value: { cents } },
    create: { key, value: { cents } },
  });
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
