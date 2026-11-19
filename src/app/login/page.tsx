import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ t }, user, sp] = await Promise.all([getT(), getCurrentUser(), searchParams]);
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "";
  if (user) redirect(next || (user.role === "admin" ? "/admin" : "/me"));

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-brand mb-6">{t.login.title}</h1>
        <LoginForm
          next={next}
          labels={{ phone: t.login.idLabel, phoneHint: t.login.idHint, password: t.form.password, submit: t.login.submit, submitting: t.form.submitting }}
        />
        <div className="mt-6 space-y-2 text-sm text-muted">
          <p>
            <Link href="/" className="text-brand font-bold underline underline-offset-4">
              {t.login.noAccount}
            </Link>
          </p>
          <p>{t.login.forgot}</p>
        </div>
      </div>
    </div>
  );
}
