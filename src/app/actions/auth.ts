"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { normalizePhone } from "@/lib/phone";

export type LoginState = { error?: string; phone?: string };

function safeNext(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const { t } = await getT();
  const rawPhone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: t.errors.phone, phone: rawPhone };

  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: t.errors.badLogin, phone: rawPhone };
  }
  await createSession(user.id);
  const next = safeNext(formData.get("next"));
  redirect(next || (user.role === "admin" ? "/admin" : "/me"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
