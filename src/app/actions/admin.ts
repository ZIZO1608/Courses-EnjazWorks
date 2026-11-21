"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { courseImages, courses, registrations, sessions, users, type RegistrationStatus } from "@/db/schema";
import { generateTempPassword, getCurrentUser, hashPassword } from "@/lib/auth";
import { formatDateTime, parseLocalDateTime } from "@/lib/format";
import { dict } from "@/lib/i18n";
import { getT } from "@/lib/lang";
import { notifyUsers } from "@/lib/notify";
import { questionsSchema } from "@/lib/questions";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");
  return user;
}

/* ---------- Courses ---------- */

export type CourseFormState = { errors?: Record<string, string>; saved?: boolean };

const MAX_IMAGE = 2 * 1024 * 1024;

export async function saveCourse(_prev: CourseFormState, formData: FormData): Promise<CourseFormState> {
  await assertAdmin();
  const { t } = await getT();
  const req = t.errors.required;

  const schema = z.object({
    titleAr: z.string().trim().min(1, req).max(200),
    titleEn: z.string().trim().min(1, req).max(200),
    descriptionAr: z.string().trim().max(5000),
    descriptionEn: z.string().trim().max(5000),
    instructor: z.string().trim().max(200),
    scheduleAr: z.string().trim().max(200),
    scheduleEn: z.string().trim().max(200),
    durationAr: z.string().trim().max(100),
    durationEn: z.string().trim().max(100),
    locationAr: z.string().trim().max(200),
    locationEn: z.string().trim().max(200),
    currency: z.enum(["SYP", "USD"]),
    seats: z.coerce.number({ invalid_type_error: req }).int().min(1, req).max(10000),
    status: z.enum(["draft", "open", "closed"]),
  });
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;

  // Empty = "date coming soon"; anything else must be a valid date.
  const startsRaw = String(raw.startsAt ?? "").trim();
  const startsAt = startsRaw ? parseLocalDateTime(startsRaw) : null;
  if (startsRaw && !startsAt) errors.startsAt = req;

  const priceRaw = String(raw.price ?? "").replace(/[,\s]/g, "");
  const price = priceRaw === "" ? null : Number(priceRaw);
  if (price !== null && (!Number.isInteger(price) || price < 0)) errors.price = req;

  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;
  if (hasImage && (!image.type.startsWith("image/") || image.size > MAX_IMAGE)) errors.image = t.admin.fields.image;

  let questionsJson: unknown = [];
  try {
    questionsJson = JSON.parse(String(raw.questions ?? "[]"));
  } catch {
    questionsJson = null;
  }
  const questions = questionsSchema.safeParse(questionsJson);
  if (!questions.success) errors.questions = t.admin.questions.invalid;

  if (Object.keys(errors).length || !parsed.success || !questions.success) return { errors };

  let imageId: number | null | undefined = undefined; // undefined = keep current
  if (hasImage) {
    const [img] = await db
      .insert(courseImages)
      .values({ mime: image.type, data: Buffer.from(await image.arrayBuffer()) })
      .returning({ id: courseImages.id });
    imageId = img.id;
  } else if (formData.get("removeImage") === "on") {
    imageId = null;
  }

  const values = { ...parsed.data, questions: questions.data, startsAt, price, updatedAt: new Date(), ...(imageId !== undefined ? { imageId } : {}) };
  const id = Number(formData.get("id"));

  let notified = 0;
  if (id) {
    const [before] = await db.select({ startsAt: courses.startsAt }).from(courses).where(eq(courses.id, id)).limit(1);
    await db.update(courses).set(values).where(eq(courses.id, id));
    const dateChanged = startsAt && before && before.startsAt?.getTime() !== startsAt.getTime();
    if (dateChanged) notified = await announceDate(id, before.startsAt !== null);
  } else {
    await db.insert(courses).values(values);
  }
  revalidatePath("/");
  revalidatePath("/admin/courses");
  redirect(notified ? `/admin/courses?notified=${notified}` : "/admin/courses");
}

/** Tells everyone still registered (pending / accepted / waitlist) the course's new date. */
async function announceDate(courseId: number, wasSet: boolean) {
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course?.startsAt) return 0;
  const active = and(eq(registrations.courseId, courseId), inArray(registrations.status, ["pending", "accepted", "waitlist"]));
  const regs = await db.select({ userId: registrations.userId }).from(registrations).where(active);
  // New date → the 24-hour reminder should go out again.
  await db.update(registrations).set({ reminderSentAt: null }).where(eq(registrations.courseId, courseId));
  if (regs.length === 0) return 0;
  const title = wasSet ? "dateChangedTitle" : "dateSetTitle";
  await notifyUsers(
    regs.map((r) => r.userId),
    {
      titleAr: dict.ar.notify[title](course.titleAr),
      titleEn: dict.en.notify[title](course.titleEn || course.titleAr),
      bodyAr: dict.ar.notify.dateBody(formatDateTime(course.startsAt, "ar"), course.locationAr),
      bodyEn: dict.en.notify.dateBody(formatDateTime(course.startsAt, "en"), course.locationEn || course.locationAr),
      url: `/courses/${courseId}#calendar`,
    },
  );
  return regs.length;
}

export async function deleteCourse(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  if (id) await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

/* ---------- Registrations ---------- */

const STATUSES = ["pending", "accepted", "rejected", "waitlist", "cancelled"] as const;

export async function setRegistrationStatus(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as RegistrationStatus;
  if (!id || !STATUSES.includes(status)) return;

  const [row] = await db
    .select({ reg: registrations, course: courses })
    .from(registrations)
    .innerJoin(courses, eq(courses.id, registrations.courseId))
    .where(eq(registrations.id, id))
    .limit(1);
  if (!row || row.reg.status === status) return;

  await db
    .update(registrations)
    .set({
      status,
      updatedAt: new Date(),
      // Re-accepting someone should give them a fresh reminder.
      ...(status === "accepted" ? { reminderSentAt: null } : {}),
    })
    .where(eq(registrations.id, id));

  await notifyUsers([row.reg.userId], {
    titleAr: dict.ar.notify.statusTitle(row.course.titleAr),
    titleEn: dict.en.notify.statusTitle(row.course.titleEn),
    bodyAr: dict.ar.notify.statusBody[status],
    bodyEn: dict.en.notify.statusBody[status],
    url: "/me",
  }).catch((err) => console.error("[admin] status notify failed", err));

  revalidatePath("/admin", "layout");
}

export async function setRegistrationPaid(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  const paid = formData.get("paid") === "true";
  if (!id) return;
  await db.update(registrations).set({ paid, updatedAt: new Date() }).where(eq(registrations.id, id));
  revalidatePath("/admin", "layout");
}

/* ---------- Students ---------- */

export type ResetState = { password?: string; userId?: number };

export async function resetStudentPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  await assertAdmin();
  const userId = Number(formData.get("userId"));
  if (!userId) return {};
  const password = generateTempPassword();
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, userId));
  // Log the student out everywhere so only the new password works.
  await db.delete(sessions).where(eq(sessions.userId, userId));
  return { password, userId };
}

/* ---------- Broadcast ---------- */

export type BroadcastState = { errors?: Record<string, string>; sent?: number };

export async function broadcast(_prev: BroadcastState, formData: FormData): Promise<BroadcastState> {
  await assertAdmin();
  const { t } = await getT();
  const courseId = Number(formData.get("courseId"));
  const audience = formData.get("audience") === "accepted" ? "accepted" : "active";
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);

  const errors: Record<string, string> = {};
  if (!courseId) errors.courseId = t.errors.required;
  if (!title) errors.title = t.errors.required;
  if (!body) errors.body = t.errors.required;
  if (Object.keys(errors).length) return { errors };

  const statuses: RegistrationStatus[] = audience === "accepted" ? ["accepted"] : ["pending", "accepted", "waitlist"];
  const rows = await db
    .select({ userId: registrations.userId })
    .from(registrations)
    .where(and(eq(registrations.courseId, courseId), inArray(registrations.status, statuses)));

  const sent = await notifyUsers(
    rows.map((r) => r.userId),
    { titleAr: title, titleEn: title, bodyAr: body, bodyEn: body, url: `/courses/${courseId}` },
  );
  return { sent };
}
