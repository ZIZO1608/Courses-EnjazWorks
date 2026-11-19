import { RegistrationsTable } from "@/components/RegistrationsTable";
import { allCoursesForFilter, findRegistrations, type RegFilters } from "@/lib/admin-queries";
import { getT } from "@/lib/lang";

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<RegFilters> }) {
  const sp = await searchParams;
  const [{ lang, t }, rows, courseList] = await Promise.all([getT(), findRegistrations(sp), allCoursesForFilter()]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-4">
      <form className="card p-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] items-end">
        <div>
          <label htmlFor="course" className="field-label">{t.admin.table.course}</label>
          <select id="course" name="course" className="input" defaultValue={sp.course ?? ""}>
            <option value="">{t.admin.allCourses}</option>
            {courseList.map((c) => (
              <option key={c.id} value={c.id}>{lang === "en" ? c.titleEn : c.titleAr}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="field-label">{t.admin.table.status}</label>
          <select id="status" name="status" className="input" defaultValue={sp.status ?? ""}>
            <option value="">{t.admin.allStatuses}</option>
            {(["pending", "accepted", "waitlist", "rejected", "cancelled"] as const).map((s) => (
              <option key={s} value={s}>{t.status[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="q" className="field-label">{t.admin.search}</label>
          <input id="q" name="q" className="input" defaultValue={sp.q ?? ""} />
        </div>
        <button className="btn btn-primary">{t.admin.filter}</button>
        <a href={`/admin/registrations/export${qs ? `?${qs}` : ""}`} className="btn btn-outline">
          {t.admin.exportCsv}
        </a>
      </form>
      <p className="text-sm text-muted latin">{rows.length}</p>
      <RegistrationsTable rows={rows} lang={lang} t={t} />
    </div>
  );
}
