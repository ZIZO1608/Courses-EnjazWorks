import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: DB;
};

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.pgClient) {
    globalForDb.pgClient = postgres(url, { max: 10, onnotice: () => {} });
  }
  return globalForDb.pgClient;
}

function getDb(): DB {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = drizzle(getSql(), { schema });
  }
  return globalForDb.drizzleDb;
}

/** Connects on first use, so importing this file never needs a database (e.g. during `next build`). */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
