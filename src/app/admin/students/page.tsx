import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { registrations, users } from "@/db/schema";
import { ResetPasswordButton } from "@/components/ResetPasswordButton";
import { formatDate } from "@/lib/format";
import { getT } from "@/lib/lang";
import { displayPhone, whatsappLink } from "@/lib/phone";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { lang, t } = await getT();
  const years = t.form.years as Record<string, string>;
  const term = q?.trim() ? `%${q.trim()}%` : null;

  const rows = await db
    .select({
      user: users,
      count: sql<number>`(select count(*)::int from ${registrations} r where r.user_id = ${users.id})`,
    })
    .from(users)
    .where(term ? or(ilike(users.fullName, term), ilike(users.phone, term)) : eq(users.role, "student"))
    .orderBy(desc(users.createdAt))
    .limit(500);

  const tempLabel = lang === "ar" ? "كلمة المرور المؤقتة:" : "Temporary password:";

  return (
    <div className="space-y-4">
      <form className="card p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="q" className="field-label">{t.admin.search}</label>
          <input id="q" name="q" className="input" defaultValue={q ?? ""} />
        </div>
        <button className="btn btn-primary">{t.admin.filter}</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table min-w-[760px]">
          <thead>
            <tr>
              <th>{t.admin.table.student}</th>
              <th>{t.admin.table.phone}</th>
              <th>{t.admin.table.study}</th>
              <th>{t.admin.table.registered}</th>
              <th>{t.admin.table.date}</th>
              <th>{t.admin.resetPassword}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ user, count }) => (
              <tr key={user.id}>
                <td className="font-bold">
                  {user.fullName}
                  {user.role === "admin" && <span className="ms-2 text-xs text-rose">admin</span>}
                </td>
                <td>
                  <a href={whatsappLink(user.phone)} target="_blank" rel="noreferrer" className="latin text-brand font-bold hover:underline">
                    {displayPhone(user.phone)}
                  </a>
                </td>
                <td className="text-sm">
                  {[user.university, user.major, user.studyYear ? years[user.studyYear] ?? user.studyYear : null]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="latin">{count}</td>
                <td className="whitespace-nowrap text-muted">{formatDate(user.createdAt, lang)}</td>
                <td>
                  {user.role === "student" && (
                    <ResetPasswordButton
                      userId={user.id}
                      label={t.admin.resetPassword}
                      resultPrefix={tempLabel}
                      whatsappHref={whatsappLink(user.phone)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-muted">{t.admin.noRows}</p>}
      </div>
    </div>
  );
}
