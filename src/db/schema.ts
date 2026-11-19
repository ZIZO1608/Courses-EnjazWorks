import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { Answer, Question } from "@/lib/questions";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const roleEnum = pgEnum("role", ["student", "admin"]);
export const langEnum = pgEnum("lang", ["ar", "en"]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "open", "closed"]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "accepted",
  "rejected",
  "waitlist",
  "cancelled",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("student"),
  university: text("university"),
  major: text("major"),
  studyYear: text("study_year"),
  heardFrom: text("heard_from"),
  lang: langEnum("lang").notNull().default("ar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const courseImages = pgTable("course_images", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionAr: text("description_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  instructor: text("instructor").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  scheduleAr: text("schedule_ar").notNull().default(""),
  scheduleEn: text("schedule_en").notNull().default(""),
  durationAr: text("duration_ar").notNull().default(""),
  durationEn: text("duration_en").notNull().default(""),
  locationAr: text("location_ar").notNull().default(""),
  locationEn: text("location_en").notNull().default(""),
  price: integer("price"),
  currency: text("currency").notNull().default("SYP"),
  seats: integer("seats").notNull(),
  imageId: integer("image_id").references(() => courseImages.id, { onDelete: "set null" }),
  status: courseStatusEnum("status").notNull().default("draft"),
  /** Extra registration questions for this course (see src/lib/questions.ts). */
  questions: jsonb("questions").$type<Question[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const registrations = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").notNull().default("pending"),
    paid: boolean("paid").notNull().default(false),
    notes: text("notes"),
    /** Answers to the course's custom questions, with question text snapshotted. */
    answers: jsonb("answers").$type<Answer[]>().notNull().default([]),
    adminNote: text("admin_note"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("registrations_user_course_uq").on(t.userId, t.courseId),
    index("registrations_course_idx").on(t.courseId),
    index("registrations_status_idx").on(t.status),
  ],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("push_user_idx").on(t.userId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),
    bodyAr: text("body_ar").notNull(),
    bodyEn: text("body_en").notNull(),
    url: text("url").notNull().default("/me"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type RegistrationStatus = (typeof registrationStatusEnum.enumValues)[number];
export type Lang = (typeof langEnum.enumValues)[number];
