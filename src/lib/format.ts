import type { Lang } from "./i18n";

/** Syria is on UTC+3 all year. All course times are entered and shown in Damascus time. */
export const APP_TZ = "Asia/Damascus";
export const APP_TZ_OFFSET = "+03:00";

const locale = (lang: Lang) => (lang === "ar" ? "ar-SY-u-nu-latn" : "en-GB");

export const DATE_TBA = { ar: "يُعلن الموعد قريباً", en: "Date coming soon" } as const;

export function formatDateTime(d: Date | null, lang: Lang) {
  if (!d) return DATE_TBA[lang];
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: APP_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(d: Date, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: APP_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatShortDateTime(d: Date | null, lang: Lang) {
  if (!d) return DATE_TBA[lang];
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: APP_TZ,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatPrice(price: number | null, currency: string, lang: Lang, freeLabel: string) {
  if (price == null || price === 0) return freeLabel;
  const n = new Intl.NumberFormat(locale(lang)).format(price);
  const cur = currency === "USD" ? "$" : lang === "ar" ? "ل.س" : "SYP";
  return currency === "USD" ? `${cur}${n}` : `${n} ${cur}`;
}

/** "2026-12-01T17:00" (Damascus wall-clock from <input type=datetime-local>) → Date */
export function parseLocalDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00${APP_TZ_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "2026-12-01T17:00" in Damascus time, for <input type=datetime-local>. */
export function toLocalInputValue(d: Date | null) {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function pick<T extends Record<string, unknown>>(obj: T, base: string, lang: Lang): string {
  const key = `${base}${lang === "ar" ? "Ar" : "En"}`;
  const fallback = `${base}${lang === "ar" ? "En" : "Ar"}`;
  return (obj[key] as string) || (obj[fallback] as string) || "";
}
