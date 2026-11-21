import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { icsFile, siteOrigin } from "@/lib/calendar";
import { getLang } from "@/lib/lang";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [course] = Number.isInteger(id) ? await db.select().from(courses).where(eq(courses.id, id)).limit(1) : [];
  if (!course || course.status === "draft" || !course.startsAt) return new Response("Not found", { status: 404 });
  const lang = await getLang();
  const body = icsFile(course, lang, `${siteOrigin(req.headers)}/courses/${course.id}`);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="enjazwork-${course.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
