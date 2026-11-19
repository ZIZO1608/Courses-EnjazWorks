"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { registerForCourse, type RegisterState } from "@/app/actions/register";
import { SubmitButton } from "./SubmitButton";

type Option = { value: string; label: string };

export type FormQuestion = {
  name: string;
  type: "text" | "textarea" | "choice";
  label: string;
  required: boolean;
  options: Option[];
};

export type RegisterLabels = {
  title: string;
  accountSection: string;
  questionsSection: string;
  optional: string;
  fullName: string;
  phone: string;
  phoneHint: string;
  password: string;
  passwordHint: string;
  university: string;
  major: string;
  studyYear: string;
  heardFrom: string;
  notes: string;
  choose: string;
  submit: string;
  submitting: string;
  haveAccount: string;
  loginFirst: string;
  loggedInAs: string | null;
};

export function RegisterForm({
  courseId,
  loggedIn,
  labels,
  years,
  heard,
  questions,
}: {
  courseId: number;
  questions: FormQuestion[];
  loggedIn: boolean;
  labels: RegisterLabels;
  years: Option[];
  heard: Option[];
}) {
  const [state, action] = useActionState<RegisterState, FormData>(registerForCourse, {});
  const v = state.values ?? {};
  // Hide a field's error as soon as the student edits that field.
  const [edited, setEdited] = useState<Set<string>>(new Set());
  useEffect(() => setEdited(new Set()), [state]);
  const err = Object.fromEntries(
    Object.entries(state.errors ?? {}).filter(([name]) => !edited.has(name)),
  ) as Record<string, string | undefined>;
  const loginHref = `/login?next=${encodeURIComponent(`/courses/${courseId}#register`)}`;

  return (
    <form
      action={action}
      className="card p-5 sm:p-7 space-y-5"
      id="register"
      noValidate
      onChange={(e) => {
        const target = e.target as unknown as { name?: string };
        const name = target.name;
        if (name && !edited.has(name)) setEdited(new Set(edited).add(name));
      }}
    >
      <input type="hidden" name="courseId" value={courseId} />
      <div>
        <h2 className="text-2xl font-extrabold text-brand">{labels.title}</h2>
        {loggedIn ? (
          <p className="text-muted mt-1">{labels.loggedInAs}</p>
        ) : (
          <p className="text-sm text-muted mt-1">
            {labels.haveAccount}{" "}
            <Link href={loginHref} className="text-brand font-bold underline underline-offset-4">
              {labels.loginFirst}
            </Link>
          </p>
        )}
      </div>

      {state.formError && (
        <p className="rounded-xl bg-bad-bg text-bad px-4 py-3 font-bold" role="alert">
          {state.formError}
        </p>
      )}

      {!loggedIn && (
        <fieldset className="space-y-4">
          <legend className="sr-only">{labels.accountSection}</legend>
          <Field label={labels.fullName} name="fullName" error={err.fullName}>
            <input
              id="fullName"
              name="fullName"
              className="input"
              autoComplete="name"
              defaultValue={v.fullName}
              aria-invalid={!!err.fullName}
              required
            />
          </Field>

          <Field label={labels.phone} name="phone" error={err.phone} hint={labels.phoneHint}>
            <input
              id="phone"
              name="phone"
              className="input latin text-start"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              defaultValue={v.phone}
              aria-invalid={!!err.phone}
              required
            />
            {state.phoneTaken && (
              <Link href={loginHref} className="btn btn-outline btn-sm mt-2">
                {labels.loginFirst}
              </Link>
            )}
          </Field>

          <Field label={labels.password} name="password" error={err.password} hint={labels.passwordHint}>
            <input
              id="password"
              name="password"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={6}
              aria-invalid={!!err.password}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.university} name="university" error={err.university}>
              <input
                id="university"
                name="university"
                className="input"
                autoComplete="organization"
                defaultValue={v.university}
                aria-invalid={!!err.university}
                required
              />
            </Field>
            <Field label={labels.major} name="major" error={err.major}>
              <input
                id="major"
                name="major"
                className="input"
                defaultValue={v.major}
                aria-invalid={!!err.major}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.studyYear} name="studyYear" error={err.studyYear}>
              <select
                // Remount with the submitted value; React ignores defaultValue changes on <select>.
                key={`studyYear-${v.studyYear ?? ""}`}
                id="studyYear"
                name="studyYear"
                className="input"
                defaultValue={v.studyYear ?? ""}
                aria-invalid={!!err.studyYear}
                required
              >
                <option value="" disabled>
                  {labels.choose}
                </option>
                {years.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={labels.heardFrom} name="heardFrom" error={err.heardFrom}>
              <select
                // Remount with the submitted value; React ignores defaultValue changes on <select>.
                key={`heardFrom-${v.heardFrom ?? ""}`}
                id="heardFrom"
                name="heardFrom"
                className="input"
                defaultValue={v.heardFrom ?? ""}
                aria-invalid={!!err.heardFrom}
                required
              >
                <option value="" disabled>
                  {labels.choose}
                </option>
                {heard.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>
      )}

      {questions.length > 0 && (
        <fieldset className="space-y-4 border-t border-line pt-5">
          <legend className="text-lg font-extrabold text-brand mb-3">{labels.questionsSection}</legend>
          {questions.map((q) => {
            const label = q.required ? q.label : `${q.label} (${labels.optional})`;
            if (q.type === "choice") {
              return (
                <div key={q.name} role="radiogroup" aria-labelledby={`${q.name}-label`} aria-invalid={!!err[q.name]}>
                  <p id={`${q.name}-label`} className="field-label">
                    {label}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((o) => (
                      <label
                        key={o.value}
                        className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-tint"
                      >
                        <input
                          type="radio"
                          name={q.name}
                          value={o.value}
                          defaultChecked={v[q.name] === o.value}
                          className="accent-brand size-4 shrink-0"
                        />
                        <span className="font-medium">{o.label}</span>
                      </label>
                    ))}
                  </div>
                  {err[q.name] && <p className="error-text">{err[q.name]}</p>}
                </div>
              );
            }
            return (
              <Field key={q.name} label={label} name={q.name} error={err[q.name]}>
                {q.type === "textarea" ? (
                  <textarea
                    id={q.name}
                    name={q.name}
                    className="input"
                    rows={3}
                    maxLength={1000}
                    defaultValue={v[q.name]}
                    aria-invalid={!!err[q.name]}
                  />
                ) : (
                  <input
                    id={q.name}
                    name={q.name}
                    className="input"
                    maxLength={1000}
                    defaultValue={v[q.name]}
                    aria-invalid={!!err[q.name]}
                  />
                )}
              </Field>
            );
          })}
        </fieldset>
      )}

      <Field label={labels.notes} name="notes">
        <textarea id="notes" name="notes" className="input" maxLength={2000} defaultValue={v.notes} />
      </Field>

      <SubmitButton className="btn btn-primary w-full text-lg min-h-13" pendingLabel={labels.submitting}>
        {labels.submit}
      </SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      {children}
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
