-- One-off: the "From Idea to Done" workshop was added with a placeholder date (Thu 26 Nov 2026, 17:00 Damascus).
-- Clear it so the site shows "date coming soon". Only touches that exact placeholder, so a real date set later is never changed.
UPDATE "courses" SET "starts_at" = NULL, "updated_at" = now()
WHERE "title_ar" = 'من الفكرة إلى الإنجاز' AND "starts_at" = '2026-11-26 14:00:00+00';
