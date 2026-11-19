"use client";

import { useActionState } from "react";
import { resetStudentPassword, type ResetState } from "@/app/actions/admin";

export function ResetPasswordButton({
  userId,
  label,
  resultPrefix,
  whatsappHref,
}: {
  userId: number;
  label: string;
  resultPrefix: string;
  whatsappHref: string;
}) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetStudentPassword, {});
  if (state.password) {
    const msg = encodeURIComponent(`${resultPrefix} ${state.password}`);
    return (
      <div className="space-y-1">
        <p className="text-sm">
          {resultPrefix} <b className="latin text-brand select-all">{state.password}</b>
        </p>
        <a href={`${whatsappHref}?text=${msg}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-rose">
          WhatsApp
        </a>
      </div>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <button className="btn btn-outline btn-sm" disabled={pending}>
        {label}
      </button>
    </form>
  );
}
