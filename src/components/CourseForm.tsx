"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCourse, type CourseFormState } from "@/app/actions/admin";
import type { Question } from "@/lib/questions";
import { QuestionsEditor, type QuestionsEditorLabels } from "./QuestionsEditor";
import { SubmitButton } from "./SubmitButton";

type Fields = Record<
  | "titleAr" | "titleEn" | "descriptionAr" | "descriptionEn" | "instructor" | "startsAt"
  | "scheduleAr" | "scheduleEn" | "durationAr" | "durationEn" | "locationAr" | "locationEn"
  | "price" | "currency" | "seats" | "image" | "removeImage" | "status",
  string
>;

export type CourseInitial = {
  id?: number;
  titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; instructor: string;
  startsAt: string; scheduleAr: string; scheduleEn: string; durationAr: string; durationEn: string;
  locationAr: string; locationEn: string; price: string; currency: string; seats: string;
  status: string; imageId: number | null;
  questions: Question[];
};

export function CourseForm({
  initial,
  fields,
  statusLabels,
  labels,
  questionLabels,
}: {
  initial: CourseInitial;
  fields: Fields;
  statusLabels: Record<"draft" | "open" | "closed", string>;
  labels: { save: string; cancel: string; saving: string; fixErrors: string; startsHint: string };
  questionLabels: QuestionsEditorLabels;
}) {
  const [state, action] = useActionState<CourseFormState, FormData>(saveCourse, {});
  const e = state.errors ?? {};

  const text = (name: keyof CourseInitial & keyof Fields, opts: { dir?: "rtl" | "ltr"; type?: string; required?: boolean } = {}) => (
    <div>
      <label htmlFor={name} className="field-label">{fields[name]}</label>
      <input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        dir={opts.dir}
        className="input"
        defaultValue={String(initial[name] ?? "")}
        aria-invalid={!!e[name]}
        required={opts.required}
      />
      {e[name] && <p className="error-text">{e[name]}</p>}
    </div>
  );

  const area = (name: "descriptionAr" | "descriptionEn", dir: "rtl" | "ltr") => (
    <div>
      <label htmlFor={name} className="field-label">{fields[name]}</label>
      <textarea id={name} name={name} dir={dir} rows={6} className="input" defaultValue={initial[name]} />
    </div>
  );

  return (
    <form action={action} className="card p-5 sm:p-7 space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {text("titleAr", { dir: "rtl", required: true })}
        {text("titleEn", { dir: "ltr", required: true })}
        {area("descriptionAr", "rtl")}
        {area("descriptionEn", "ltr")}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          {text("startsAt", { type: "datetime-local", dir: "ltr" })}
          <p className="hint">{labels.startsHint}</p>
        </div>
        {text("instructor")}
        <div>
          <label htmlFor="status" className="field-label">{fields.status}</label>
          <select id="status" name="status" className="input" defaultValue={initial.status}>
            {(["draft", "open", "closed"] as const).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {text("scheduleAr", { dir: "rtl" })}
        {text("scheduleEn", { dir: "ltr" })}
        {text("durationAr", { dir: "rtl" })}
        {text("durationEn", { dir: "ltr" })}
        {text("locationAr", { dir: "rtl" })}
        {text("locationEn", { dir: "ltr" })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {text("price", { dir: "ltr" })}
        <div>
          <label htmlFor="currency" className="field-label">{fields.currency}</label>
          <select id="currency" name="currency" className="input" defaultValue={initial.currency}>
            <option value="SYP">SYP — ل.س</option>
            <option value="USD">USD — $</option>
          </select>
        </div>
        {text("seats", { type: "number", dir: "ltr", required: true })}
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="field-label">{fields.image}</label>
        {initial.imageId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/images/${initial.imageId}`} alt="" className="h-32 rounded-xl object-cover" />
        )}
        <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="block text-sm" />
        {e.image && <p className="error-text">{e.image}</p>}
        {initial.imageId && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="removeImage" /> {fields.removeImage}
          </label>
        )}
      </div>

      <div className="border-t border-line pt-6">
        <QuestionsEditor initial={initial.questions} labels={questionLabels} error={e.questions} />
      </div>

      {Object.keys(e).length > 0 && <p className="error-text font-bold">{labels.fixErrors}</p>}

      <div className="flex gap-3">
        <SubmitButton pendingLabel={labels.saving}>{labels.save}</SubmitButton>
        <Link href="/admin/courses" className="btn btn-ghost">{labels.cancel}</Link>
      </div>
    </form>
  );
}
