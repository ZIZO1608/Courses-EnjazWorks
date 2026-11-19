import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { courses, notifications, registrations } from "@/db/schema";
import { logout } from "@/app/actions/auth";
import { markAllRead } from "@/app/actions/push";
import { InstallButton } from "@/components/InstallButton";
import { PushToggle } from "@/components/PushToggle";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatShortDateTime, pick } from "@/lib/format";
import { getT } from "@/lib/lang";
import { getVapidPublicKey } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const metadata = { title: "صفحتي" };

export default async function MePage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const user = await requireUser("/me");
  const [{ lang, t }, sp] = await Promise.all([getT(), searchParams]);

  const [regs, inbox] = await Promise.all([
    db
      .select({ reg: registrations, course: courses })
      .from(registrations)
      .innerJoin(courses, eq(courses.id, registrations.courseId))
      .where(eq(registrations.userId, user.id))
      .orderBy(desc(registrations.createdAt)),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30),
  ]);
  const unread = inbox.filter((n) => !n.readAt).length;
  const justRegistered = regs.find((r) => String(r.course.id) === sp.registered);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand">{t.me.hello(user.fullName)}</h1>
        <form action={logout}>
          <button className="btn btn-ghost btn-sm text-muted">{t.nav.logout}</button>
        </form>
      </div>

      {justRegistered && (
        <div className="rounded-2xl bg-ok-bg text-ok px-5 py-4 font-bold" role="status">
          ✓ {pick(justRegistered.course, "title", lang)} — {t.status[justRegistered.reg.status]}
        </div>
      )}

      <section className="card p-5 sm:p-6 bg-tint border-tint-2 space-y-3">
        <h2 className="text-lg font-extrabold text-brand">{t.app.installTitle}</h2>
        <p className="text-ink">{t.app.installBody}</p>
        <div className="flex flex-wrap items-center gap-3">
          <InstallButton
            labels={{ install: t.app.install, iosTitle: t.app.iosTitle, iosSteps: [...t.app.iosSteps], close: t.app.close }}
          />
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
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold text-brand">{t.me.myRegistrations}</h2>
        {regs.length === 0 ? (
          <div className="card p-6 text-center space-y-4">
            <p className="text-muted">{t.me.none}</p>
            <Link href="/" className="btn btn-primary">
              {t.me.browse}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {regs.map(({ reg, course }) => (
              <li key={reg.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="space-y-1">
                  <Link href={`/courses/${course.id}`} className="text-lg font-extrabold text-ink hover:text-brand">
                    {pick(course, "title", lang)}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatDateTime(course.startsAt, lang)}
                    {pick(course, "location", lang) ? ` · ${pick(course, "location", lang)}` : ""}
                  </p>
                  {reg.status === "accepted" && (
                    <p className={`text-sm font-bold ${reg.paid ? "text-ok" : "text-warn"}`}>
                      {reg.paid ? t.me.paid : t.me.unpaid}
                    </p>
                  )}
                </div>
                <div className="self-start sm:self-center">
                  <StatusBadge status={reg.status} label={t.status[reg.status]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-brand">
            {t.me.notifications}
            {unread > 0 && (
              <span className="ms-2 inline-grid place-items-center min-w-6 h-6 px-1.5 rounded-full bg-rose text-white text-xs align-middle">
                {unread}
              </span>
            )}
          </h2>
          {unread > 0 && (
            <form action={markAllRead}>
              <button className="btn btn-ghost btn-sm">{t.me.markRead}</button>
            </form>
          )}
        </div>
        {inbox.length === 0 ? (
          <p className="text-muted">{t.me.noNotifications}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {inbox.map((n) => (
              <li key={n.id} className={`p-4 ${n.readAt ? "" : "bg-tint/60"}`}>
                <Link href={n.url} className="block">
                  <p className="font-bold text-ink">{lang === "en" ? n.titleEn : n.titleAr}</p>
                  <p className="text-sm text-ink/80">{lang === "en" ? n.bodyEn : n.bodyAr}</p>
                  <p className="text-xs text-muted mt-1">{formatShortDateTime(n.createdAt, lang)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
