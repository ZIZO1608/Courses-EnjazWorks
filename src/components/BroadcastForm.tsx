"use client";

import { useActionState } from "react";
import { broadcast, type BroadcastState } from "@/app/actions/admin";
import { SubmitButton } from "./SubmitButton";

export function BroadcastForm({
  courses,
  labels,
}: {
  courses: { id: number; title: string }[];
  labels: {
    course: string; choose: string; audience: string; audienceAccepted: string; audienceActive: string;
    title: string; body: string; send: string; sending: string; sentTemplate: string;
  };
}) {
  const [state, action] = useActionState<BroadcastState, FormData>(broadcast, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="card p-5 sm:p-7 space-y-4 max-w-2xl">
      {state.sent !== undefined && (
        <p className="rounded-xl bg-ok-bg text-ok px-4 py-3 font-bold" role="status">
          ✓ {labels.sentTemplate.replace("{n}", String(state.sent))}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="courseId" className="field-label">{labels.course}</label>
          <select id="courseId" name="courseId" className="input" defaultValue="" aria-invalid={!!e.courseId}>
            <option value="" disabled>{labels.choose}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {e.courseId && <p className="error-text">{e.courseId}</p>}
        </div>
        <div>
          <label htmlFor="audience" className="field-label">{labels.audience}</label>
          <select id="audience" name="audience" className="input" defaultValue="accepted">
            <option value="accepted">{labels.audienceAccepted}</option>
            <option value="active">{labels.audienceActive}</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="title" className="field-label">{labels.title}</label>
        <input id="title" name="title" className="input" maxLength={120} aria-invalid={!!e.title} />
        {e.title && <p className="error-text">{e.title}</p>}
      </div>
      <div>
        <label htmlFor="body" className="field-label">{labels.body}</label>
        <textarea id="body" name="body" className="input" rows={4} maxLength={1000} aria-invalid={!!e.body} />
        {e.body && <p className="error-text">{e.body}</p>}
      </div>
      <SubmitButton pendingLabel={labels.sending}>{labels.send}</SubmitButton>
    </form>
  );
}
