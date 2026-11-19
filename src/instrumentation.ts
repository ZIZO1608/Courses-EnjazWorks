/**
 * Runs once when the server starts (Node runtime only):
 * 1. applies any pending database migrations
 * 2. starts the reminder loop (every 10 minutes)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[startup] DATABASE_URL not set — skipping migrations and reminders");
    return;
  }

  const path = await import("node:path");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;

  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(migrationClient), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    console.log("[startup] database migrations applied");
  } catch (err) {
    console.error("[startup] migration failed", err);
    throw err;
  } finally {
    await migrationClient.end();
  }

  const { sendDueReminders } = await import("./lib/reminders");
  const tick = async () => {
    try {
      const n = await sendDueReminders();
      if (n) console.log(`[reminders] sent ${n}`);
    } catch (err) {
      console.error("[reminders] failed", err);
    }
  };
  setTimeout(tick, 30_000);
  setInterval(tick, 10 * 60 * 1000);
}
