"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { courses, registrations, users } from "@/db/schema";
import { createSession, getCurrentUser, hashPassword } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { getT } from "@/lib/lang";
import { notifyAdmins } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { fieldName, readQuestions, type Answer } from "@/lib/questions";

const YEARS = ["1", "2", "3", "4", "5", "6", "grad", "postgrad", "notStudent"] as const;
const HEARD = ["instagram", "facebook", "whatsapp", "friend", "university", "website", "other"] as const;

export type RegisterState = {
  errors?: Partial<Record<string, string>>;
  formError?: string;
  values?: Record<string, string>;
  phoneTaken?: boolean;
};

export async function registerForCourse(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const { t } = await getT();
  const values = Object.fromEntries(
    [...formData.entries()].filter(([k]) => k !== "password").map(([k, v]) => [k, String(v)]),
  );
  const courseId = Number(formData.get("courseId"));
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000) || null;

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course || course.status !== "open") return { formError: t.errors.courseClosed, values };

  // Course-specific questions are checked first, so all errors show together.
  const errors: Record<string, string> = {};
  const answers: Answer[] = [];
  for (const q of readQuestions(course.questions)) {
    const value = String(formData.get(fieldName(q)) ?? "").trim();
    if (!value) {
      if (q.required) errors[fieldName(q)] = t.errors.required;
      continue;
    }
    let answerAr = value.slice(0, 1000);
    let answerEn = answerAr;
    if (q.type === "choice") {
      const option = q.options[Number(value)];
      if (!/^\d+$/.test(value) || !option) {
        errors[fieldName(q)] = t.errors.required;
        continue;
      }
      answerAr = option.ar;
      answerEn = option.en || option.ar;
    }
    answers.push({ qid: q.id, questionAr: q.labelAr, questionEn: q.labelEn || q.labelAr, answerAr, answerEn });
  }

  let user = await getCurrentUser();
  if (user && Object.keys(errors).length) return { errors, values };

  if (!user) {
    const schema = z.object({
      fullName: z.string().trim().min(3, t.errors.required).max(120),
      phone: z.string().trim().min(1, t.errors.required),
      password: z.string().min(6, t.errors.password).max(100),
      university: z.string().trim().min(1, t.errors.required).max(120),
      major: z.string().trim().min(1, t.errors.required).max(120),
      studyYear: z.enum(YEARS, { errorMap: () => ({ message: t.errors.required }) }),
      heardFrom: z.enum(HEARD, { errorMap: () => ({ message: t.errors.required }) }),
    });
    const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    }
    const phone = normalizePhone(String(formData.get("phone") ?? ""));
    if (!errors.phone && !phone) errors.phone = t.errors.phone;
    if (Object.keys(errors).length || !parsed.success || !phone) return { errors, values };

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (existing) return { errors: { phone: t.errors.phoneTaken }, values, phoneTaken: true };

    const lang = (await getT()).lang;
    const [created] = await db
      .insert(users)
      .values({
        fullName: parsed.data.fullName,
        phone,
        passwordHash: await hashPassword(parsed.data.password),
        university: parsed.data.university,
        major: parsed.data.major,
        studyYear: parsed.data.studyYear,
        heardFrom: parsed.data.heardFrom,
        lang,
      })
      .returning();
    await createSession(created.id);
    const { passwordHash: _omit, ...rest } = created;
    user = rest;
  }

  const [already] = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.userId, user.id), eq(registrations.courseId, course.id)))
    .limit(1);
  if (already) redirect(`/me?registered=${course.id}`);

  const [{ taken }] = await db
    .select({ taken: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(eq(registrations.courseId, course.id), inArray(registrations.status, ["pending", "accepted"])));
  const status = taken >= course.seats ? "waitlist" : "pending";

  await db.insert(registrations).values({ userId: user.id, courseId: course.id, status, notes, answers });

  await notifyAdmins({
    titleAr: dict.ar.notify.newRegistrationTitle,
    titleEn: dict.en.notify.newRegistrationTitle,
    bodyAr: dict.ar.notify.newRegistrationBody(user.fullName, course.titleAr),
    bodyEn: dict.en.notify.newRegistrationBody(user.fullName, course.titleEn),
    url: `/admin/registrations?course=${course.id}`,
  }).catch((err) => console.error("[register] admin notify failed", err));

  redirect(`/me?registered=${course.id}`);
}
