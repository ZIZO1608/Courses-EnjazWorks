import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { deleteCourse } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CourseForm } from "@/components/CourseForm";
import { courseFormProps, courseToInitial } from "@/lib/course-form";
import { getT } from "@/lib/lang";

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { t } = await getT();
  const [course] = Number.isInteger(id) && id > 0 ? await db.select().from(courses).where(eq(courses.id, id)).limit(1) : [];
  if (!course) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-brand">{t.admin.editCourse}</h2>
      <CourseForm initial={courseToInitial(course)} {...courseFormProps(t)} />
      <form action={deleteCourse} className="pt-2">
        <input type="hidden" name="id" value={course.id} />
        <ConfirmButton message={t.admin.confirmDelete} className="btn btn-sm text-bad hover:bg-bad-bg">
          {t.admin.delete}
        </ConfirmButton>
      </form>
    </div>
  );
}
