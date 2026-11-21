import type { Course } from "@/db/schema";

/** "2.5 hours" → 150. Falls back to 2 hours when the duration isn't in hours (e.g. "4 weeks"). */
export function sessionMinutes(course: Pick<Course, "durationEn">) {
  const m = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i.exec(course.durationEn);
  const hours = m ? Number(m[1]) : 2;
  return Math.round(Math.min(Math.max(hours, 0.5), 12) * 60);
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function eventParts(course: Course, lang: "ar" | "en") {
  const start = course.startsAt!;
  const end = new Date(start.getTime() + sessionMinutes(course) * 60_000);
  const title = (lang === "en" && course.titleEn) || course.titleAr;
  const location = (lang === "en" && course.locationEn) || course.locationAr;
  return { start, end, title, location };
}

export function googleCalendarUrl(course: Course, lang: "ar" | "en", pageUrl: string) {
  const { start, end, title, location } = eventParts(course, lang);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `enjazwork — ${pageUrl}`,
    location,
    ctz: "Asia/Damascus",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** A single-event .ics file. iPhone opens it straight into Calendar; Outlook too. */
export function icsFile(course: Course, lang: "ar" | "en", pageUrl: string) {
  const { start, end, title, location } = eventParts(course, lang);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//enjazwork//courses//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:course-${course.id}-${stamp(start)}@courses.enjazwork.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title)}`,
    location ? `LOCATION:${esc(location)}` : "",
    `DESCRIPTION:${esc(`enjazwork — ${pageUrl}`)}`,
    `URL:${pageUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Public base URL of the site, as the visitor reached it (Traefik passes the real host). */
export function siteOrigin(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "courses.enjazwork.com";
  const proto = headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
