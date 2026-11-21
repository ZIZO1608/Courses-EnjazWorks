import type { Course } from "@/db/schema";
import { readQuestions } from "./questions";
import type { CourseInitial } from "@/components/CourseForm";
import { toLocalInputValue } from "./format";
import type { Dict } from "./i18n";

export function courseToInitial(c?: Course): CourseInitial {
  return {
    id: c?.id,
    titleAr: c?.titleAr ?? "",
    titleEn: c?.titleEn ?? "",
    descriptionAr: c?.descriptionAr ?? "",
    descriptionEn: c?.descriptionEn ?? "",
    instructor: c?.instructor ?? "",
    startsAt: toLocalInputValue(c?.startsAt ?? null),
    scheduleAr: c?.scheduleAr ?? "",
    scheduleEn: c?.scheduleEn ?? "",
    durationAr: c?.durationAr ?? "",
    durationEn: c?.durationEn ?? "",
    locationAr: c?.locationAr ?? "",
    locationEn: c?.locationEn ?? "",
    price: c?.price != null ? String(c.price) : "",
    currency: c?.currency ?? "SYP",
    seats: c ? String(c.seats) : "20",
    status: c?.status ?? "draft",
    imageId: c?.imageId ?? null,
    questions: readQuestions(c?.questions ?? []),
  };
}

export function courseFormProps(t: Dict) {
  return {
    fields: { ...t.admin.fields },
    statusLabels: { ...t.admin.courseStatus },
    labels: { save: t.admin.save, cancel: t.admin.cancel, saving: t.form.submitting, fixErrors: t.errors.fixBelow, startsHint: t.admin.startsHint },
    questionLabels: { ...t.admin.questions, types: { ...t.admin.questions.types } },
  };
}
