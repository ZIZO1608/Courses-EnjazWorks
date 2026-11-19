import Link from "next/link";
import type { Course } from "@/db/schema";
import type { Dict, Lang } from "@/lib/i18n";
import { formatDateTime, formatPrice, pick } from "@/lib/format";

export function CourseCard({ course, taken, lang, t }: { course: Course; taken: number; lang: Lang; t: Dict }) {
  const left = Math.max(course.seats - taken, 0);
  return (
    <Link
      href={`/courses/${course.id}`}
      className="card overflow-hidden flex flex-col hover:border-rose hover:shadow-[0_8px_30px_-12px_rgb(122_30_60/0.35)] transition"
    >
      <CourseCover course={course} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="text-xl font-extrabold text-brand leading-snug">{pick(course, "title", lang)}</h3>
        <dl className="text-sm space-y-1.5 text-ink">
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">{t.course.startsAt}:</dt>
            <dd className="font-medium">{formatDateTime(course.startsAt, lang)}</dd>
          </div>
          {pick(course, "duration", lang) && (
            <div className="flex gap-2">
              <dt className="text-muted shrink-0">{t.course.duration}:</dt>
              <dd className="font-medium">{pick(course, "duration", lang)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-lg font-extrabold text-ink">
            {formatPrice(course.price, course.currency, lang, t.course.free)}
          </span>
          <span className={`text-xs font-bold rounded-full px-3 py-1 ${left > 0 ? "bg-tint text-brand" : "bg-warn-bg text-warn"}`}>
            {t.course.seatsLeft(left)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CourseCover({ course, tall = false }: { course: Course; tall?: boolean }) {
  if (course.imageId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/images/${course.imageId}`}
        alt=""
        className={`w-full object-cover bg-tint ${tall ? "aspect-[16/7]" : "aspect-[16/9]"}`}
      />
    );
  }
  return (
    <div
      className={`w-full bg-brand relative overflow-hidden ${tall ? "aspect-[16/7]" : "aspect-[16/9]"}`}
      aria-hidden="true"
    >
      <CircuitPattern />
    </div>
  );
}

/** The brand's circuit-node device, used as a cover when a course has no image. */
function CircuitPattern() {
  return (
    <svg viewBox="0 0 320 180" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <g fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 150 L90 90 L150 90" stroke="#c4506f" opacity="0.7" />
        <circle cx="30" cy="150" r="9" fill="#7a1e3c" stroke="#c4506f" opacity="0.7" />
        <circle cx="150" cy="90" r="5" fill="#c4506f" stroke="none" opacity="0.7" />
        <path d="M200 20 L240 60 L300 60" stroke="#ffffff" opacity="0.35" />
        <circle cx="200" cy="20" r="9" fill="#7a1e3c" stroke="#ffffff" opacity="0.35" />
        <circle cx="300" cy="60" r="5" fill="#ffffff" stroke="none" opacity="0.35" />
        <path d="M250 170 L250 130 L290 110" stroke="#c4506f" opacity="0.5" />
        <circle cx="250" cy="170" r="9" fill="#7a1e3c" stroke="#c4506f" opacity="0.5" />
        <circle cx="290" cy="110" r="5" fill="#c4506f" stroke="none" opacity="0.5" />
        <path d="M60 20 L110 20 L130 45" stroke="#ffffff" opacity="0.25" />
        <circle cx="60" cy="20" r="7" fill="#7a1e3c" stroke="#ffffff" opacity="0.25" />
      </g>
    </svg>
  );
}
