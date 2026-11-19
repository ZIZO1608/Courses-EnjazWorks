"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { notifyUsers } from "@/lib/notify";

type SubJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function savePushSubscription(sub: SubJSON) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false as const };
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  return { ok: true as const };
}

export async function removePushSubscription(endpoint: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
}

export async function sendTestNotification() {
  const user = await getCurrentUser();
  if (!user) return;
  await notifyUsers([user.id], {
    titleAr: dict.ar.notify.testTitle,
    titleEn: dict.en.notify.testTitle,
    bodyAr: dict.ar.notify.testBody,
    bodyEn: dict.en.notify.testBody,
    url: user.role === "admin" ? "/admin" : "/me",
  });
  revalidatePath("/me");
}

export async function markAllRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/me");
}
