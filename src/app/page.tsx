import { CourseCard } from "@/components/CourseCard";
import { InstallButton } from "@/components/InstallButton";
import { getOpenCourses } from "@/lib/courses";
import { getT } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ lang, t }, rows] = await Promise.all([getT(), getOpenCourses()]);

  return (
    <>
      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-[#f2c4d2] font-bold text-sm mb-3">{t.brandTagline}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-2xl">{t.home.title}</h1>
          <div className="h-1 w-16 bg-rose rounded-full my-5" />
          <p className="text-lg text-white/85 max-w-xl">{t.home.subtitle}</p>
          <div className="mt-6">
            <InstallButton
              labels={{
                install: t.app.install,
                iosTitle: t.app.iosTitle,
                iosSteps: [...t.app.iosSteps],
                close: t.app.close,
              }}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-extrabold text-brand mb-6">{t.home.openCourses}</h2>
        {rows.length === 0 ? (
          <div className="card p-8 text-center text-muted">{t.home.empty}</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ course, taken }) => (
              <CourseCard key={course.id} course={course} taken={taken} lang={lang} t={t} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
