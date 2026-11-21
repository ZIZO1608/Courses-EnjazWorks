import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { CourseCover } from "@/components/CourseCard";
import { RegisterForm } from "@/components/RegisterForm";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/auth";
import { googleCalendarUrl, siteOrigin } from "@/lib/calendar";
import { getCourse } from "@/lib/courses";
import { formatDateTime, formatPrice, pick } from "@/lib/format";
import { getT } from "@/lib/lang";
import { fieldName, readQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getCourse(Number(id));
  if (!data) return {};
  return { title: data.course.titleAr };
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  const [{ lang, t }, data, user] = await Promise.all([getT(), getCourse(Number(id)), getCurrentUser()]);
  if (!data) notFound();
  const { course, taken } = data;

  // Drafts are only visible to admins.
  if (course.status === "draft" && user?.role !== "admin") notFound();

  const existing = user
    ? (
        await db
          .select()
          .from(registrations)
          .where(and(eq(registrations.userId, user.id), eq(registrations.courseId, course.id)))
          .limit(1)
      )[0]
    : undefined;

  const left = Math.max(course.seats - taken, 0);
  const title = pick(course, "title", lang);
  const description = pick(course, "description", lang);

  const facts: [string, string][] = (
    [
      ...(course.startsAt ? [[t.course.startsAt, formatDateTime(course.startsAt, lang)]] : []),
      [t.course.schedule, pick(course, "schedule", lang)],
      [t.course.duration, pick(course, "duration", lang)],
      [t.course.location, pick(course, "location", lang)],
      [t.course.instructor, course.instructor],
      [t.course.price, formatPrice(course.price, course.currency, lang, t.course.free)],
      [t.course.seats, t.course.seatsLeft(left)],
    ] as [string, string][]
  ).filter(([, value]) => value);

  const pageUrl = `${siteOrigin(await headers())}/courses/${course.id}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <div className="card overflow-hidden mb-6">
        <CourseCover course={course} tall />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_440px] items-start">
        <article>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand leading-tight">{title}</h1>
          <div className="h-1 w-14 bg-rose rounded-full my-5" />
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
            {facts.map(([label, value]) => (
              <div key={label} className="bg-tint rounded-2xl px-4 py-3">
                <dt className="text-xs font-bold text-rose mb-1">{label}</dt>
                <dd className="font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {course.startsAt ? (
            <div id="calendar" className="mb-8 scroll-mt-24 flex flex-wrap items-center gap-2">
              <span className="font-bold text-brand me-1">{t.course.addToCalendar}:</span>
              <a href={googleCalendarUrl(course, lang, pageUrl)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                <CalendarIcon /> {t.course.googleCalendar}
              </a>
              <a href={`/courses/${course.id}/calendar.ics`} className="btn btn-outline btn-sm">
                <CalendarIcon /> {t.course.appleCalendar}
              </a>
            </div>
          ) : (
            <div id="calendar" className="mb-8 flex items-start gap-4 rounded-2xl border-2 border-dashed border-rose/60 bg-tint px-5 py-4">
              <span className="relative mt-1 grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white">
                <BellIcon />
                <span className="absolute -top-0.5 -end-0.5 size-3 rounded-full bg-rose animate-ping" />
                <span className="absolute -top-0.5 -end-0.5 size-3 rounded-full bg-rose" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-brand">{t.course.tbaTitle}</p>
                <p className="font-medium text-ink">{t.course.tbaBody}</p>
              </div>
            </div>
          )}

          {description && (
            <div className="text-lg leading-loose whitespace-pre-line text-ink">{description}</div>
          )}
        </article>

        <aside className="lg:sticky lg:top-24">
          {existing ? (
            <div className="card p-6 space-y-4">
              <StatusBadge status={existing.status} label={t.status[existing.status]} />
              <p className="font-medium">{t.course.alreadyRegistered}</p>
              <Link href="/me" className="btn btn-primary w-full">
                {t.course.goToMe}
              </Link>
            </div>
          ) : course.status !== "open" ? (
            <div className="card p-6 text-center font-bold text-muted">{t.course.closed}</div>
          ) : (
            <RegisterForm
              courseId={course.id}
              loggedIn={!!user}
              labels={{
                title: t.form.title,
                accountSection: t.form.accountSection,
                questionsSection: t.form.questionsSection,
                optional: t.form.optional,
                fullName: t.form.fullName,
                phone: t.form.phone,
                phoneHint: t.form.phoneHint,
                password: t.form.password,
                passwordHint: t.form.passwordHint,
                university: t.form.university,
                major: t.form.major,
                studyYear: t.form.studyYear,
                heardFrom: t.form.heardFrom,
                notes: t.form.notes,
                choose: t.form.choose,
                submit: t.form.submit,
                submitting: t.form.submitting,
                haveAccount: t.form.haveAccount,
                loginFirst: t.form.loginFirst,
                loggedInAs: user ? t.form.loggedInAs(user.fullName) : null,
              }}
              years={Object.entries(t.form.years).map(([value, label]) => ({ value, label }))}
              heard={Object.entries(t.form.heard).map(([value, label]) => ({ value, label }))}
              questions={readQuestions(course.questions).map((q) => ({
                name: fieldName(q),
                type: q.type,
                label: lang === "en" && q.labelEn ? q.labelEn : q.labelAr,
                required: q.required,
                options: q.options.map((o, i) => ({
                  value: String(i),
                  label: lang === "en" && o.en ? o.en : o.ar,
                })),
              }))}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
