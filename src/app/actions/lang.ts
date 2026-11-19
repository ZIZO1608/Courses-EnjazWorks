"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { LANG_COOKIE } from "@/lib/i18n";

export async function setLang(formData: FormData) {
  const lang = formData.get("lang") === "en" ? "en" : "ar";
  const jar = await cookies();
  jar.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  // Remember the choice so push notifications arrive in the same language.
  const user = await getCurrentUser();
  if (user) await db.update(users).set({ lang }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
}
