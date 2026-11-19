import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/lib/lang";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة الإدارة" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold text-brand">{t.admin.title}</h1>
        <AdminNav
          items={[
            { href: "/admin", label: t.admin.dashboard },
            { href: "/admin/registrations", label: t.admin.registrations },
            { href: "/admin/courses", label: t.admin.courses },
            { href: "/admin/students", label: t.admin.students },
            { href: "/admin/broadcast", label: t.admin.broadcast },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
