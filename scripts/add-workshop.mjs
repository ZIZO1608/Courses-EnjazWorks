/**
 * Adds the "من الفكرة إلى الإنجاز" workshop as a DRAFT course, with its registration questions.
 * Then set the date, place, seats and fee in /admin/courses and switch it to "open".
 *
 *   Coolify: open the app → Terminal →  node scripts/add-workshop.mjs
 *
 * Safe to run twice: if the workshop already exists it does nothing.
 */
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const TITLE_AR = "من الفكرة إلى الإنجاز";

const descriptionAr = `ورشة عملية لطلاب الجامعات من كل الاختصاصات، نعرض فيها كيف يختصر الذكاء الاصطناعي العمل: موقع كامل بُني في ثلاثة أيام بدل شهر.

محاور الورشة:
• من نحن: فريق إنجازوورك، وكيف نحوّل الأفكار إلى مشاريع تُسلَّم في وقتها
• لماذا يهمك هذا الآن، ومسارات AlgoQuant التعليمية
• السوفتوير: موقعان حقيقيان بُنيا باستخدام Claude Code، خطوة بخطوة
• الهاردوير: جهاز ذكي لدعم الركبة يساعد على المشي، من الفكرة إلى النموذج
• أسئلة وأجوبة، والتعريف بالدورات القادمة

لا تحتاج خبرة مسبقة في البرمجة. أحضر فضولك وفكرة مشروعك إن كانت لديك.`;

const descriptionEn = `A hands-on workshop for university students of every major. We show how AI shortens the work: a full website built in three days instead of a month.

What we cover:
• Who we are: the enjazwork team, and how we turn ideas into projects delivered on time
• Why this matters to you now, and the AlgoQuant learning tracks
• Software: two real websites built with Claude Code, step by step
• Hardware: a smart knee brace that helps people walk, from idea to prototype
• Q&A, and the upcoming courses

No coding experience needed. Bring your curiosity, and your project idea if you have one.`;

const questions = [
  {
    id: "aiuse",
    type: "choice",
    labelAr: "ما مستوى استخدامك لأدوات الذكاء الاصطناعي؟",
    labelEn: "How much do you use AI tools?",
    required: true,
    options: [
      { ar: "لم أستخدمها بعد", en: "Not yet" },
      { ar: "أستخدمها أحياناً (مثل ChatGPT)", en: "Sometimes (e.g. ChatGPT)" },
      { ar: "أستخدمها يومياً في الدراسة أو العمل", en: "Daily, for study or work" },
    ],
  },
  {
    id: "track",
    type: "choice",
    labelAr: "أي جزء من الورشة يهمك أكثر؟",
    labelEn: "Which part of the workshop interests you most?",
    required: true,
    options: [
      { ar: "السوفتوير وبناء المواقع", en: "Software and building websites" },
      { ar: "الهاردوير والأجهزة الذكية", en: "Hardware and smart devices" },
      { ar: "الاثنان معاً", en: "Both" },
    ],
  },
  {
    id: "hasidea",
    type: "choice",
    labelAr: "هل لديك فكرة مشروع تريد تنفيذها؟ (مشروع تخرج أو مشروع شخصي)",
    labelEn: "Do you have a project idea you want to build? (graduation or personal project)",
    required: true,
    options: [
      { ar: "نعم", en: "Yes" },
      { ar: "ليس بعد", en: "Not yet" },
    ],
  },
  {
    id: "ideadesc",
    type: "textarea",
    labelAr: "إذا كانت لديك فكرة، صفها في سطرين",
    labelEn: "If you have an idea, describe it in two lines",
    required: false,
    options: [],
  },
  {
    id: "algoquant",
    type: "choice",
    labelAr: "هل تهتم بالتسجيل في أحد مسارات AlgoQuant بعد الورشة؟",
    labelEn: "Are you interested in joining an AlgoQuant track after the workshop?",
    required: true,
    options: [
      { ar: "نعم، أرسلوا لي التفاصيل", en: "Yes, send me the details" },
      { ar: "ربما", en: "Maybe" },
      { ar: "لا", en: "No" },
    ],
  },
  {
    id: "askus",
    type: "text",
    labelAr: "ما السؤال الذي تريد أن نجيب عنه في الورشة؟",
    labelEn: "What question do you want us to answer in the workshop?",
    required: false,
    options: [],
  },
];

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

const [existing] = await sql`select id from courses where title_ar = ${TITLE_AR} limit 1`;
if (existing) {
  console.log(`Workshop already exists: course #${existing.id}. Nothing changed.`);
} else {
  // No date yet: the site shows "date coming soon". Setting it in the admin panel notifies everyone registered.
  const startsAt = null;

  const [row] = await sql`
    insert into courses (
      title_ar, title_en, description_ar, description_en, starts_at,
      duration_ar, duration_en, seats, status, questions
    ) values (
      ${TITLE_AR}, ${"From Idea to Done"}, ${descriptionAr}, ${descriptionEn}, ${startsAt},
      ${"ساعتان ونصف"}, ${"2.5 hours"}, ${40}, 'draft', ${sql.json(questions)}
    )
    returning id`;
  console.log(`Workshop added as a draft: course #${row.id}.`);
  console.log("Next: /admin/courses → edit it → set place, seats, fee → status Open → Save. Add the date whenever it is decided.");
}
await sql.end();
