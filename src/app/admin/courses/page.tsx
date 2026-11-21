import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { formatShortDateTime, pick } from "@/lib/format";
import { getT } from "@/lib/lang";

const statusTone = { draft: "bg-gray-100 text-gray-600", open: "bg-ok-bg text-ok", closed: "bg-bad-bg text-bad" };

export default async function AdminCourses({ searchParams }: { searchParams: Promise<{ notified?: string }> }) {
  const { lang, t } = await getT();
  const notified = Number((await searchParams).notified) || 0;
  const rows = await db
    .select({
      course: courses,
      taken: sql<number>`(select count(*)::int from registrations r where r.course_id = ${courses.id} and r.status in ('pending','accepted'))`,
      total: sql<number>`(select count(*)::int from registrations r where r.course_id = ${courses.id})`,
    })
    .from(courses)
    .orderBy(desc(courses.startsAt));

  return (
    <div className="space-y-4">
      {notified > 0 && (
        <p className="rounded-xl bg-ok-bg text-ok px-4 py-3 font-bold" role="status">
          {t.admin.notified(notified)}
        </p>
      )}
      <Link href="/admin/courses/new" className="btn btn-primary">+ {t.admin.newCourse}</Link>
      {rows.length === 0 ? (
        <div className="card p-6 text-center text-muted">{t.admin.noRows}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table min-w-[720px]">
            <thead>
              <tr>
                <th>{t.admin.table.course}</th>
                <th>{t.admin.table.starts}</th>
                <th>{t.admin.table.seats}</th>
                <th>{t.admin.table.registered}</th>
                <th>{t.admin.table.status}</th>
                <th>{t.admin.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ course, taken, total }) => (
                <tr key={course.id}>
                  <td className="font-bold">{pick(course, "title", lang)}</td>
                  <td className="whitespace-nowrap">{formatShortDateTime(course.startsAt, lang)}</td>
                  <td className="latin">{t.admin.seatsTaken(taken, course.seats)}</td>
                  <td>
                    <Link href={`/admin/registrations?course=${course.id}`} className="text-brand font-bold hover:underline latin">
                      {total}
                    </Link>
                  </td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[course.status]}`}>
                      {t.admin.courseStatus[course.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap space-x-1 rtl:space-x-reverse">
                    <Link href={`/admin/courses/${course.id}`} className="btn btn-outline btn-sm">{t.admin.editCourse}</Link>
                    <Link href={`/courses/${course.id}`} className="btn btn-ghost btn-sm">{t.course.details}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
