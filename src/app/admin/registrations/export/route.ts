import { getCurrentUser } from "@/lib/auth";
import { findRegistrations } from "@/lib/admin-queries";
import { dict } from "@/lib/i18n";
import { formatShortDateTime } from "@/lib/format";
import { displayPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formulas and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};


export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const rows = await findRegistrations({
    course: url.searchParams.get("course") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  const t = dict.ar;
  const years = t.form.years as Record<string, string>;
  const heard = t.form.heard as Record<string, string>;
  const header = ["الاسم", "واتساب", "الجامعة", "الاختصاص", "السنة", "كيف سمع عنا", "الدورة", "الحالة", "الدفع", "التاريخ", "ملاحظات"];
  const lines = rows.map(({ reg, user: u, course }) =>
    [
      u.fullName,
      displayPhone(u.phone),
      u.university,
      u.major,
      u.studyYear ? years[u.studyYear] ?? u.studyYear : "",
      u.heardFrom ? heard[u.heardFrom] ?? u.heardFrom : "",
      course.titleAr,
      t.status[reg.status],
      reg.paid ? "مدفوع" : "غير مدفوع",
      formatShortDateTime(reg.createdAt, "ar"),
      reg.notes ?? "",
    ]
      .map(cell)
      .join(","),
  );
  // BOM so Excel opens Arabic correctly.
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${date}.csv"`,
    },
  });
}
