"use client";

import { useState } from "react";
import { newQuestionId, type Question, type QuestionType } from "@/lib/questions";

export type QuestionsEditorLabels = {
  title: string;
  intro: string;
  add: string;
  type: string;
  types: Record<QuestionType, string>;
  labelAr: string;
  labelEn: string;
  required: string;
  options: string;
  optionAr: string;
  optionEn: string;
  addOption: string;
  remove: string;
  removeOption: string;
  moveUp: string;
  moveDown: string;
  empty: string;
};

/** Edits a course's custom questions; the result is submitted as JSON in a hidden "questions" field. */
export function QuestionsEditor({
  initial,
  labels,
  error,
}: {
  initial: Question[];
  labels: QuestionsEditorLabels;
  error?: string;
}) {
  const [questions, setQuestions] = useState<Question[]>(initial);

  const update = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, dir: -1 | 1) =>
    setQuestions((qs) => {
      const j = i + dir;
      if (j < 0 || j >= qs.length) return qs;
      const next = [...qs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const add = () =>
    setQuestions((qs) => [
      ...qs,
      { id: newQuestionId(), type: "choice", labelAr: "", labelEn: "", required: true, options: [{ ar: "", en: "" }, { ar: "", en: "" }] },
    ]);

  return (
    <section className="space-y-4">
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />
      <div>
        <h3 className="text-lg font-extrabold text-brand">{labels.title}</h3>
        <p className="text-sm text-muted">{labels.intro}</p>
        {error && <p className="error-text font-bold">{error}</p>}
      </div>

      {questions.length === 0 && <p className="text-sm text-muted">{labels.empty}</p>}

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-line bg-tint/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="size-7 shrink-0 rounded-full bg-brand text-white grid place-items-center text-sm font-bold latin">
                {i + 1}
              </span>
              <select
                aria-label={labels.type}
                className="input max-w-56 min-h-10 py-1.5"
                value={q.type}
                onChange={(e) => {
                  const type = e.target.value as QuestionType;
                  update(i, {
                    type,
                    options: type === "choice" && q.options.length < 2 ? [{ ar: "", en: "" }, { ar: "", en: "" }] : q.options,
                  });
                }}
              >
                {(Object.keys(labels.types) as QuestionType[]).map((t) => (
                  <option key={t} value={t}>
                    {labels.types[t]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-sm font-bold text-brand ms-1">
                <input type="checkbox" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} />
                {labels.required}
              </label>
              <div className="ms-auto flex gap-1">
                <IconButton label={labels.moveUp} onClick={() => move(i, -1)} disabled={i === 0}>↑</IconButton>
                <IconButton label={labels.moveDown} onClick={() => move(i, 1)} disabled={i === questions.length - 1}>↓</IconButton>
                <IconButton label={labels.remove} onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} danger>
                  ✕
                </IconButton>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                aria-label={labels.labelAr}
                placeholder={labels.labelAr}
                dir="rtl"
                className="input"
                value={q.labelAr}
                onChange={(e) => update(i, { labelAr: e.target.value })}
              />
              <input
                aria-label={labels.labelEn}
                placeholder={labels.labelEn}
                dir="ltr"
                className="input"
                value={q.labelEn}
                onChange={(e) => update(i, { labelEn: e.target.value })}
              />
            </div>

            {q.type === "choice" && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-rose">{labels.options}</p>
                {q.options.map((o, k) => (
                  <div key={k} className="flex gap-2 items-center">
                    <input
                      aria-label={labels.optionAr}
                      placeholder={labels.optionAr}
                      dir="rtl"
                      className="input min-h-10 py-1.5"
                      value={o.ar}
                      onChange={(e) =>
                        update(i, { options: q.options.map((x, m) => (m === k ? { ...x, ar: e.target.value } : x)) })
                      }
                    />
                    <input
                      aria-label={labels.optionEn}
                      placeholder={labels.optionEn}
                      dir="ltr"
                      className="input min-h-10 py-1.5"
                      value={o.en}
                      onChange={(e) =>
                        update(i, { options: q.options.map((x, m) => (m === k ? { ...x, en: e.target.value } : x)) })
                      }
                    />
                    <IconButton
                      label={labels.removeOption}
                      onClick={() => update(i, { options: q.options.filter((_, m) => m !== k) })}
                      disabled={q.options.length <= 2}
                      danger
                    >
                      ✕
                    </IconButton>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => update(i, { options: [...q.options, { ar: "", en: "" }] })}
                >
                  {labels.addOption}
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn-outline btn-sm" onClick={add}>
        {labels.add}
      </button>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`size-9 shrink-0 rounded-lg grid place-items-center font-bold disabled:opacity-30 ${
        danger ? "text-bad hover:bg-bad-bg" : "text-brand hover:bg-tint"
      }`}
    >
      {children}
    </button>
  );
}
