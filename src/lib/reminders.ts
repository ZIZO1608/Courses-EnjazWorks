import { and, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import { db, getSql } from "@/db";
import { courses, registrations } from "@/db/schema";
import { dict } from "./i18n";
import { formatDateTime } from "./format";
import { notifyUsers } from "./notify";

const LOCK_KEY = 74021; // any constant; stops two app instances sending the same reminders

/**
 * Sends one reminder to each accepted student whose course starts within the next 24 hours.
 * Safe to run as often as you like: each registration is reminded once.
 */
export async function sendDueReminders() {
  // Advisory locks belong to one connection, so take and release it on a reserved one.
  const conn = await getSql().reserve();
  const [{ locked }] = await conn`select pg_try_advisory_lock(${LOCK_KEY}) as locked`;
  if (!locked) {
    conn.release();
    return 0;
  }
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const due = await db
      .select({ reg: registrations, course: courses })
      .from(registrations)
      .innerJoin(courses, eq(courses.id, registrations.courseId))
      .where(
        and(
          eq(registrations.status, "accepted"),
          isNull(registrations.reminderSentAt),
          gt(courses.startsAt, now),
          lte(courses.startsAt, in24h),
        ),
      );

    // Group by course so each course's message is built once.
    const byCourse = new Map<number, { course: typeof due[number]["course"]; userIds: number[]; regIds: number[] }>();
    for (const row of due) {
      const g = byCourse.get(row.course.id) ?? { course: row.course, userIds: [], regIds: [] };
      g.userIds.push(row.reg.userId);
      g.regIds.push(row.reg.id);
      byCourse.set(row.course.id, g);
    }

    let sent = 0;
    for (const { course, userIds, regIds } of byCourse.values()) {
      // Mark first so a crash never causes a double reminder.
      await db.update(registrations).set({ reminderSentAt: now }).where(inArray(registrations.id, regIds));
      sent += await notifyUsers(userIds, {
        titleAr: dict.ar.notify.reminderTitle(course.titleAr),
        titleEn: dict.en.notify.reminderTitle(course.titleEn),
        bodyAr: dict.ar.notify.reminderBody(formatDateTime(course.startsAt, "ar"), course.locationAr),
        bodyEn: dict.en.notify.reminderBody(formatDateTime(course.startsAt, "en"), course.locationEn),
        url: `/courses/${course.id}`,
      });
    }
    return sent;
  } finally {
    await conn`select pg_advisory_unlock(${LOCK_KEY})`;
    conn.release();
  }
}
