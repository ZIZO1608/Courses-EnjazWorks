ALTER TABLE "courses" ADD COLUMN "questions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "answers" jsonb DEFAULT '[]'::jsonb NOT NULL;