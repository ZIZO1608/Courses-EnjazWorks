# courses.enjazwork.com

Course & workshop registration for **enjazwork** (إنجازوورك).
Students register with their WhatsApp number, follow their status, and get phone notifications.
Admins add courses, accept/reject registrations, track payment, and message students.

Arabic + English, installable on phones (PWA), burgundy enjazwork identity.

## What it does

**Students**
- See open courses → open one → fill the registration form (name, WhatsApp, password, university, major, year, how they heard about us, notes)
- The WhatsApp number is their login. Their account is created by the same form.
- If seats are full, they go to the waitlist automatically
- "My page": their registrations and statuses, paid/unpaid, notification inbox
- Install button (Android prompt, iPhone step-by-step guide) and a "turn on notifications" button

**Admins** (`/admin`)
- Overview: pending count, totals, latest registrations, notifications switch
- Courses: add/edit (Arabic + English text, start time, schedule, duration, location, fee in SYP/USD, seats, cover image, draft/open/closed)
- Registrations: filter by course/status/name, change status (pending / accepted / waitlist / rejected / cancelled), mark paid, WhatsApp link, CSV export (opens in Excel)
- Students: search, generate a temporary password and send it on WhatsApp
- Send message: push + inbox message to the students of one course

**Notifications** (web push, no Firebase, no monthly cost)
| When | Who gets it |
| --- | --- |
| A student registers | All admins |
| Admin changes a registration's status | That student |
| 24 hours before a course starts | Every accepted student, once |
| Admin sends a message | Students of the chosen course |

Every notification is also saved in the user's inbox on the site, so nothing is lost if push is off.

> **iPhone:** push only works after the student installs the app (Safari → Share → Add to Home Screen) and opens it from the home screen. The site shows them these steps.

## Stack

Next.js 15 (App Router, server actions) · PostgreSQL · Drizzle ORM · Tailwind CSS 4 · `web-push` (VAPID).
One Docker container + one Postgres database. Migrations and the reminder job run inside the app; no extra services.

## Deploy on Coolify

### 1. DNS
Where `enjazwork.com`'s DNS is managed, add:

| Type | Name | Value |
| --- | --- | --- |
| A | `courses` | your server's IP |

### 2. Database
Coolify → your project → **+ New → Database → PostgreSQL** (16 or newer). Start it, then copy its **internal** connection URL (`postgres://…`).

Turn on **Scheduled Backups** for this database (daily is fine).

### 3. Push keys (once, forever)
On any computer with Node:

```bash
npx web-push generate-vapid-keys
```

Keep the two keys safe. **Never change them later**: changing them silently breaks every phone that already turned on notifications.

### 4. App
Coolify → **+ New → Application → GitHub** → `ZIZO1608/Courses-EnjazWorks`, branch `main`.

- Build pack: **Dockerfile**
- Port: **3000**
- Domain: `https://courses.enjazwork.com` (Coolify issues the HTTPS certificate; notifications require HTTPS)
- Health check path: `/api/health`

Environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the internal URL from step 2 |
| `VAPID_PUBLIC_KEY` | from step 3 |
| `VAPID_PRIVATE_KEY` | from step 3 |
| `VAPID_SUBJECT` | `mailto:` + an email you read, e.g. `mailto:admin@enjazwork.com` |

Deploy. The database tables are created automatically on first start.

### 5. Admin accounts
Coolify → the app → **Terminal**, run once per admin:

```bash
node scripts/create-admin.mjs "Anas" 09XXXXXXXX "strong-password"
node scripts/create-admin.mjs "Zaven" 09XXXXXXXX "strong-password"
node scripts/create-admin.mjs "Ahmad" 09XXXXXXXX "strong-password"
```

Running it again for the same number resets that admin's password. It also turns an existing student account into an admin.

### 6. On each admin's phone
Open `courses.enjazwork.com` → log in → **Install app** → open it from the home screen → **Turn on notifications** on the admin overview → tap **Send a test notification**.

## Local development

```bash
npm install
cp .env.example .env.local   # fill DATABASE_URL + VAPID keys
npm run db:migrate
npm run admin:create -- "Your Name" 09XXXXXXXX "password123"
npm run dev
```

Changing the database schema: edit `src/db/schema.ts`, then `npm run db:generate` and commit the new file in `drizzle/`. It's applied automatically on the next deploy.

## Notes

- **Time zone:** course times are entered and shown in Damascus time (UTC+3).
- **Seats:** pending + accepted registrations hold a seat; waitlist doesn't. Accepting someone from the waitlist is a manual decision.
- **Forgotten passwords:** there's no SMS. The student messages you on WhatsApp, and an admin generates a temporary password from the Students page.
- **Course images** are stored in the database (max 2 MB each), so backups cover them and there's no volume to manage.
