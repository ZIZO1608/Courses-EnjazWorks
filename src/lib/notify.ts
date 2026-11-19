import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { notifications, pushSubscriptions, users } from "@/db/schema";

let vapidReady: boolean | null = null;

function ensureVapid() {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn("[push] VAPID keys missing — notifications are saved in-app only");
    vapidReady = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@enjazwork.com", pub, priv);
  vapidReady = true;
  return true;
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

export type Message = {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  url?: string;
};

/**
 * Saves the message in each user's inbox, then pushes it to every device they enabled,
 * in the language each user last chose. Dead subscriptions are removed.
 */
export async function notifyUsers(userIds: number[], msg: Message) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return 0;
  const url = msg.url ?? "/me";

  await db.insert(notifications).values(
    ids.map((userId) => ({
      userId,
      titleAr: msg.titleAr,
      titleEn: msg.titleEn,
      bodyAr: msg.bodyAr,
      bodyEn: msg.bodyEn,
      url,
    })),
  );

  if (!ensureVapid()) return ids.length;

  const subs = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      lang: users.lang,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(inArray(pushSubscriptions.userId, ids));

  const dead: number[] = [];
  await Promise.all(
    subs.map(async (s) => {
      const payload = JSON.stringify({
        title: s.lang === "en" ? msg.titleEn : msg.titleAr,
        body: s.lang === "en" ? msg.bodyEn : msg.bodyAr,
        url,
        dir: s.lang === "en" ? "ltr" : "rtl",
        lang: s.lang,
      });
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24, urgency: "high" },
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
        else console.error("[push] send failed", code, (err as Error).message);
      }
    }),
  );

  if (dead.length) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, dead));
  }
  return ids.length;
}

export async function notifyAdmins(msg: Message) {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  return notifyUsers(
    admins.map((a) => a.id),
    msg,
  );
}
