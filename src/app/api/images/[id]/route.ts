import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseImages } from "@/db/schema";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });
  const [img] = await db.select().from(courseImages).where(eq(courseImages.id, id)).limit(1);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      // A new upload always gets a new id, so the bytes behind an id never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
