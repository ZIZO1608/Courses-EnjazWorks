import Link from "next/link";
import type { Course, Registration, User } from "@/db/schema";
import { setRegistrationPaid, setRegistrationStatus } from "@/app/actions/admin";
import { AutoSubmitSelect } from "./AutoSubmitSelect";
import type { Dict, Lang } from "@/lib/i18n";
import { formatShortDateTime, pick } from "@/lib/format";
import { displayPhone, whatsappLink } from "@/lib/phone";

type Row = { reg: Registration; user: User; course: Course };

const statusTone: Record<string, string> = {
  pending: "border-warn text-warn",
  accepted: "border-ok text-ok",
  rejected: "border-bad text-bad",
  waitlist: "border-brand text-brand",
  cancelled: "border-gray-400 text-gray-600",
};

export function RegistrationsTable({ rows, lang, t }: { rows: Row[]; lang: Lang; t: Dict }) {
  if (rows.length === 0) return <div className="card p-6 text-center text-muted">{t.admin.noRows}</div>;
  const years = t.form.years as Record<string, string>;

  return (
    <div className="card overflow-x-auto">
      <table className="table min-w-[1100px]">
        <thead>
          <tr>
            <th>{t.admin.table.student}</th>
            <th>{t.admin.table.phone}</th>
            <th>{t.admin.table.course}</th>
            <th>{t.admin.table.status}</th>
            <th>{t.admin.table.paid}</th>
            <th>{t.admin.table.date}</th>
            <th>{t.admin.answersCol}</th>
            <th>{t.admin.table.notes}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ reg, user, course }) => (
            <tr key={reg.id}>
              <td>
                <p className="font-bold">{user.fullName}</p>
                <p className="text-xs text-muted">
                  {[user.university, user.major, user.studyYear ? years[user.studyYear] ?? user.studyYear : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </td>
              <td>
                <a href={whatsappLink(user.phone)} target="_blank" rel="noreferrer" className="latin text-brand font-bold hover:underline">
                  {displayPhone(user.phone)}
                </a>
              </td>
              <td>
                <Link href={`/admin/registrations?course=${course.id}`} className="hover:text-brand">
                  {pick(course, "title", lang)}
                </Link>
              </td>
              <td>
                <form action={setRegistrationStatus} key={`${reg.id}-${reg.status}`}>
                  <input type="hidden" name="id" value={reg.id} />
                  <AutoSubmitSelect
                    name="status"
                    defaultValue={reg.status}
                    aria-label={t.admin.table.status}
                    className={`rounded-lg border-2 bg-white px-2 py-1.5 text-sm font-bold ${statusTone[reg.status]}`}
                  >
                    {(["pending", "accepted", "waitlist", "rejected", "cancelled"] as const).map((s) => (
                      <option key={s} value={s}>
                        {t.status[s]}
                      </option>
                    ))}
                  </AutoSubmitSelect>
                </form>
              </td>
              <td>
                <form action={setRegistrationPaid} key={`${reg.id}-${reg.paid}`}>
                  <input type="hidden" name="id" value={reg.id} />
                  <input type="hidden" name="paid" value={reg.paid ? "false" : "true"} />
                  <button
                    className={`btn btn-sm ${reg.paid ? "bg-ok-bg text-ok" : "btn-outline"}`}
                    title={reg.paid ? t.admin.markUnpaid : t.admin.markPaid}
                  >
                    {reg.paid ? `✓ ${t.me.paid}` : t.admin.markPaid}
                  </button>
                </form>
              </td>
              <td className="whitespace-nowrap text-muted">{formatShortDateTime(reg.createdAt, lang)}</td>
              <td className="min-w-64 max-w-80 text-sm">
                {reg.answers.length > 0 && (
                  <dl className="space-y-1.5">
                    {reg.answers.map((a) => (
                      <div key={a.qid}>
                        <dt className="text-xs text-muted">{lang === "en" ? a.questionEn : a.questionAr}</dt>
                        <dd className="font-bold whitespace-pre-line">{lang === "en" ? a.answerEn : a.answerAr}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </td>
              <td className="max-w-56 text-sm whitespace-pre-line">{reg.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
