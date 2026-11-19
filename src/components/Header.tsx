import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { logout } from "@/app/actions/auth";
import { setLang } from "@/app/actions/lang";
import { InstallButton } from "./InstallButton";

export async function Header() {
  const [{ lang, t }, user] = await Promise.all([getT(), getCurrentUser()]);
  const other = lang === "ar" ? "en" : "ar";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
        <Link href="/" className="shrink-0" aria-label="إنجازوورك">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="إنجازوورك" className="h-7 sm:h-8 w-auto" />
        </Link>

        <nav className="flex items-center gap-1 ms-auto text-sm">
          <Link href="/" className="btn btn-ghost btn-sm hidden sm:inline-flex">
            {t.nav.courses}
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="btn btn-ghost btn-sm">
              {t.nav.admin}
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/me"
                className={`btn btn-ghost btn-sm ${user.role === "admin" ? "hidden sm:inline-flex" : ""}`}
              >
                {t.nav.me}
              </Link>
              <form action={logout} className="hidden sm:block">
                <button className="btn btn-ghost btn-sm text-muted">{t.nav.logout}</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm">
              {t.nav.login}
            </Link>
          )}
          <InstallButton
            compact
            labels={{
              install: t.app.install,
              iosTitle: t.app.iosTitle,
              iosSteps: [...t.app.iosSteps],
              close: t.app.close,
            }}
          />
          <form action={setLang}>
            <input type="hidden" name="lang" value={other} />
            <button className="btn btn-outline btn-sm" lang={other} aria-label={t.nav.switchLang}>
              <span className="sm:hidden latin">{other === "en" ? "EN" : "ع"}</span>
              <span className="hidden sm:inline">{t.nav.switchLang}</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
