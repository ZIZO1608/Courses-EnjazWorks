import "server-only";
import { cookies } from "next/headers";
import { dict, LANG_COOKIE, type Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get(LANG_COOKIE)?.value === "en" ? "en" : "ar";
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: dict[lang] };
}
