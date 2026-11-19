/**
 * Create an admin who logs in with a username, or reset an existing admin's password.
 *
 *   Coolify: open the app → Terminal →
 *     node scripts/create-admin.mjs anas "a-strong-password"
 *     node scripts/create-admin.mjs anas            ← no password: one is generated and printed
 *
 *   Local:   npm run admin:create -- anas "a-strong-password"
 *
 * Older form (admin logs in with a WhatsApp number) still works:
 *     node scripts/create-admin.mjs "Anas" 0912345678 "a-strong-password"
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import postgres from "postgres";

function normalizePhone(input) {
  let s = String(input).trim().replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  s = s.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^09\d{8}$/.test(s)) return "+963" + s.slice(1);
  if (/^9\d{8}$/.test(s)) return "+963" + s;
  if (/^963\d{9}$/.test(s)) return "+" + s;
  if (/^\+\d{8,15}$/.test(s)) return s;
  return null;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const USAGE = 'Usage: node scripts/create-admin.mjs <username> ["password"]   e.g. node scripts/create-admin.mjs anas "my-pass-123"';
const args = process.argv.slice(2);
if (!process.env.DATABASE_URL) fail("DATABASE_URL is not set");

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

if (args.length === 3) {
  // Legacy: "Full Name" phone password
  const [name, rawPhone, password] = args;
  if (password.length < 8) fail("Admin password must be at least 8 characters");
  const phone = normalizePhone(rawPhone);
  if (!phone) fail("Invalid phone number");
  const hash = await bcrypt.hash(password, 10);
  const [row] = await sql`
    insert into users (full_name, phone, password_hash, role)
    values (${name}, ${phone}, ${hash}, 'admin')
    on conflict (phone) do update
      set role = 'admin', password_hash = excluded.password_hash, full_name = excluded.full_name
    returning id, full_name, phone`;
  console.log(`Admin ready: #${row.id} ${row.full_name} — log in with ${row.phone}`);
} else if (args.length === 1 || args.length === 2) {
  const username = args[0].trim().toLowerCase();
  if (!/^[a-z][a-z0-9_.-]{1,30}$/.test(username)) fail(`Username must be English letters/numbers, e.g. anas\n${USAGE}`);
  const generated = args.length === 1;
  const password = generated ? randomBytes(9).toString("base64url") : args[1];
  if (password.length < 8) fail("Admin password must be at least 8 characters");
  const fullName = username.charAt(0).toUpperCase() + username.slice(1);
  const hash = await bcrypt.hash(password, 10);
  const [row] = await sql`
    insert into users (full_name, username, password_hash, role)
    values (${fullName}, ${username}, ${hash}, 'admin')
    on conflict (username) do update
      set role = 'admin', password_hash = excluded.password_hash
    returning id, full_name, username`;
  // Log out any old sessions so only the new password works.
  await sql`delete from sessions where user_id = ${row.id}`;
  console.log(`Admin ready: #${row.id} ${row.full_name} — username: ${row.username}`);
  if (generated) console.log(`Password: ${password}   (save it now, it is not shown again)`);
} else {
  await sql.end();
  fail(USAGE);
}
await sql.end();
