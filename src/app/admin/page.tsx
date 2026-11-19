import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { courses, registrations, users } from "@/db/schema";
import { PushToggle } from "@/components/PushToggle";
import { RegistrationsTable } from "@/components/RegistrationsTable";
import { getT } from "@/lib/lang";
import { getVapidPublicKey } from "@/lib/notify";

export default async function AdminHome() {
  const { lang, t } = await getT();

  const [[stats], recent] = await Promise.all([
    db
      .select({
        open: sql<number>`(select count(*)::int from ${courses} where status = 'open')`,
        pending: sql<number>`(select count(*)::int from ${registrations} where status = 'pending')`,
        students: sql<number>`(select count(*)::int from ${users} where role = 'student')`,
        registrations: sql<number>`(select count(*)::int from ${registrations})`,
      })
      .from(sql`(select 1) as one`),
    db
      .select({ reg: registrations, user: users, course: courses })
      .from(registrations)
      .innerJoin(users, eq(users.id, registrations.userId))
      .innerJoin(courses, eq(courses.id, registrations.courseId))
      .orderBy(desc(registrations.createdAt))
      .limit(8),
  ]);

  const cards = [
    { label: t.admin.stats.pending, value: stats.pending, href: "/admin/registrations?status=pending", accent: true },
    { label: t.admin.stats.registrations, value: stats.registrations, href: "/admin/registrations" },
    { label: t.admin.stats.open, value: stats.open, href: "/admin/courses" },
    { label: t.admin.stats.students, value: stats.students, href: "/admin/students" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`card p-4 hover:border-rose transition ${c.accent && c.value > 0 ? "bg-brand text-white border-brand" : ""}`}
          >
            <p className={`text-3xl font-extrabold latin ${c.accent && c.value > 0 ? "" : "text-brand"}`}>{c.value}</p>
            <p className={`text-sm font-bold ${c.accent && c.value > 0 ? "text-white/85" : "text-muted"}`}>{c.label}</p>
          </Link>
        ))}
      </div>

      <section className="card p-5 bg-tint border-tint-2 space-y-3">
        <h2 className="font-extrabold text-brand">{t.app.notifTitle}</h2>
        <p className="text-sm">{t.admin.notifIntro}</p>
        <PushToggle
          vapidKey={getVapidPublicKey()}
          labels={{
            notifOn: t.app.notifOn,
            notifOff: t.app.notifOff,
            notifBlocked: t.app.notifBlocked,
            notifIosNeedsInstall: t.app.notifIosNeedsInstall,
            notifUnsupported: t.app.notifUnsupported,
            notifTest: t.app.notifTest,
          }}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-brand">{t.admin.recent}</h2>
          <Link href="/admin/registrations" className="btn btn-ghost btn-sm">
            {t.admin.viewAll}
          </Link>
        </div>
        <RegistrationsTable rows={recent} lang={lang} t={t} />
      </section>
    </div>
  );
}
