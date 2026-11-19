import { getSql } from "@/db";

export const dynamic = "force-dynamic";

/** Used by Coolify's health check: 200 when the app and the database answer. */
export async function GET() {
  try {
    await getSql()`select 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
