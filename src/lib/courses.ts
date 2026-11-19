import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, registrations } from "@/db/schema";

/** Seats counted as taken: pending + accepted (waitlist doesn't hold a seat). */
export const seatTakenStatuses = ["pending", "accepted"] as const;

export async function getOpenCourses() {
  return db
    .select({
      course: courses,
      taken: sql<number>`(select count(*)::int from ${registrations} r where r.course_id = ${courses.id} and r.status in ('pending','accepted'))`,
    })
    .from(courses)
    .where(eq(courses.status, "open"))
    .orderBy(asc(courses.startsAt));
}

export async function getCourse(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) return null;
  const [{ taken }] = await db
    .select({ taken: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(eq(registrations.courseId, id), inArray(registrations.status, [...seatTakenStatuses])));
  return { course, taken };
}
