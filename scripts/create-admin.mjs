/**
 * Create an admin, or promote an existing account to admin and reset its password.
 *
 *   Local:   npm run admin:create -- "Anas" 0912345678 "a-strong-password"
 *   Coolify: open the app → Terminal →  node scripts/create-admin.mjs "Anas" 0912345678 "a-strong-password"
 */
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

const [name, rawPhone, password] = process.argv.slice(2);
if (!name || !rawPhone || !password) {
  console.error('Usage: node scripts/create-admin.mjs "Full Name" 09xxxxxxxx "password"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Admin password must be at least 8 characters");
  process.exit(1);
}
const phone = normalizePhone(rawPhone);
if (!phone) {
  console.error("Invalid phone number");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const hash = await bcrypt.hash(password, 10);
const [row] = await sql`
  insert into users (full_name, phone, password_hash, role)
  values (${name}, ${phone}, ${hash}, 'admin')
  on conflict (phone) do update
    set role = 'admin', password_hash = excluded.password_hash, full_name = excluded.full_name
  returning id, full_name, phone`;
console.log(`Admin ready: #${row.id} ${row.full_name} (${row.phone})`);
await sql.end();
