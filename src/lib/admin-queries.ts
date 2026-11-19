import "server-only";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { courses, registrations, users, type RegistrationStatus } from "@/db/schema";

const STATUSES = ["pending", "accepted", "rejected", "waitlist", "cancelled"];

export type RegFilters = { course?: string; status?: string; q?: string };

export async function findRegistrations(f: RegFilters) {
  const where: SQL[] = [];
  const courseId = Number(f.course);
  if (courseId) where.push(eq(registrations.courseId, courseId));
  if (f.status && STATUSES.includes(f.status)) where.push(eq(registrations.status, f.status as RegistrationStatus));
  if (f.q?.trim()) {
    const q = `%${f.q.trim()}%`;
    where.push(or(ilike(users.fullName, q), ilike(users.phone, q))!);
  }
  return db
    .select({ reg: registrations, user: users, course: courses })
    .from(registrations)
    .innerJoin(users, eq(users.id, registrations.userId))
    .innerJoin(courses, eq(courses.id, registrations.courseId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(registrations.createdAt))
    .limit(1000);
}

export async function allCoursesForFilter() {
  return db
    .select({ id: courses.id, titleAr: courses.titleAr, titleEn: courses.titleEn })
    .from(courses)
    .orderBy(desc(courses.startsAt));
}
