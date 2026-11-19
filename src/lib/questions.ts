import { z } from "zod";

/** A custom question an admin adds to one course's registration form. */
export type QuestionType = "text" | "textarea" | "choice";

export type Question = {
  id: string;
  type: QuestionType;
  labelAr: string;
  labelEn: string;
  required: boolean;
  options: { ar: string; en: string }[];
};

/**
 * A student's answer, stored with a snapshot of the question and answer text in both
 * languages, so old registrations still read correctly if the admin edits the questions later.
 */
export type Answer = {
  qid: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
};

const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{4,24}$/),
  type: z.enum(["text", "textarea", "choice"]),
  labelAr: z.string().trim().min(1).max(300),
  labelEn: z.string().trim().max(300),
  required: z.boolean(),
  options: z
    .array(z.object({ ar: z.string().trim().min(1).max(150), en: z.string().trim().max(150) }))
    .max(20),
});

export const questionsSchema = z
  .array(questionSchema)
  .max(30)
  .refine((qs) => qs.every((q) => q.type !== "choice" || q.options.length >= 2))
  .refine((qs) => new Set(qs.map((q) => q.id)).size === qs.length);

/** Reads questions from the database, dropping anything malformed instead of crashing. */
export function readQuestions(raw: unknown): Question[] {
  const parsed = questionsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function newQuestionId() {
  return Math.random().toString(36).slice(2, 10).padEnd(6, "0");
}

export const fieldName = (q: Pick<Question, "id">) => `q_${q.id}`;
