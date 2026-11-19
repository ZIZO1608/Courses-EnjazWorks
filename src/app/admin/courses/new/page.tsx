import { CourseForm } from "@/components/CourseForm";
import { courseFormProps, courseToInitial } from "@/lib/course-form";
import { getT } from "@/lib/lang";

export default async function NewCourse() {
  const { t } = await getT();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-brand">{t.admin.newCourse}</h2>
      <CourseForm initial={courseToInitial()} {...courseFormProps(t)} />
    </div>
  );
}
