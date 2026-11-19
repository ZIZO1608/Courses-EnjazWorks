import { BroadcastForm } from "@/components/BroadcastForm";
import { allCoursesForFilter } from "@/lib/admin-queries";
import { getT } from "@/lib/lang";

export default async function BroadcastPage() {
  const [{ lang, t }, list] = await Promise.all([getT(), allCoursesForFilter()]);
  return (
    <div className="space-y-4">
      <p className="text-muted max-w-2xl">{t.admin.broadcastIntro}</p>
      <BroadcastForm
        courses={list.map((c) => ({ id: c.id, title: lang === "en" ? c.titleEn : c.titleAr }))}
        labels={{
          course: t.admin.table.course,
          choose: t.form.choose,
          audience: t.admin.audience,
          audienceAccepted: t.admin.audienceAccepted,
          audienceActive: t.admin.audienceActive,
          title: t.admin.messageTitle,
          body: t.admin.messageBody,
          send: t.admin.send,
          sending: t.form.submitting,
          sentTemplate: t.admin.sentTo(Number.NaN).replace("NaN", "{n}"),
        }}
      />
    </div>
  );
}
