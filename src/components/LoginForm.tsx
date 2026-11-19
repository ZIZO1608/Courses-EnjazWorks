"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({
  next,
  labels,
}: {
  next: string;
  labels: { phone: string; phoneHint: string; password: string; submit: string; submitting: string };
}) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p className="rounded-xl bg-bad-bg text-bad px-4 py-3 font-bold" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="phone" className="field-label">
          {labels.phone}
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          className="input latin text-start"
          defaultValue={state.phone}
          required
        />
        <p className="hint">{labels.phoneHint}</p>
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          {labels.password}
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      <SubmitButton className="btn btn-primary w-full" pendingLabel={labels.submitting}>
        {labels.submit}
      </SubmitButton>
    </form>
  );
}
