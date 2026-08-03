"use client";

import { Avatar, Icon, useTranslation } from "@the-ride/ui";

import { Hero } from "@/components/marketing/Hero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { StatsSection } from "@/components/marketing/StatsSection";

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: "shieldCheck" as const,
      title: t("website.about.value1Title"),
      body: t("website.about.value1Body"),
    },
    {
      icon: "checkCircle" as const,
      title: t("website.about.value2Title"),
      body: t("website.about.value2Body"),
    },
    {
      icon: "users" as const,
      title: t("website.about.value3Title"),
      body: t("website.about.value3Body"),
    },
    {
      icon: "star" as const,
      title: t("website.about.value4Title"),
      body: t("website.about.value4Body"),
    },
  ];

  const timeline = [
    {
      year: "2021",
      title: t("website.about.milestone1Title"),
      body: t("website.about.milestone1Body"),
    },
    {
      year: "2022",
      title: t("website.about.milestone2Title"),
      body: t("website.about.milestone2Body"),
    },
    {
      year: "2024",
      title: t("website.about.milestone3Title"),
      body: t("website.about.milestone3Body"),
    },
    {
      year: "2026",
      title: t("website.about.milestone4Title"),
      body: t("website.about.milestone4Body"),
    },
  ];

  const team = [
    { name: "Alexis Moreau", role: t("website.about.teamRoleCeo") },
    { name: "Jordan Lee", role: t("website.about.teamRoleCto") },
    { name: "Sofia Ramirez", role: t("website.about.teamRoleOps") },
    { name: "Malik Thompson", role: t("website.about.teamRoleSafety") },
  ];

  const stats = [
    { value: "2021", label: t("website.about.statFounded") },
    { value: "40+", label: t("website.about.statCities") },
    { value: "250K+", label: t("website.about.statRiders") },
    { value: "18K+", label: t("website.about.statDrivers") },
  ];

  return (
    <div>
      <Hero>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-brand-300 mb-4 inline-block text-sm font-semibold uppercase tracking-widest">
            {t("website.about.eyebrow")}
          </span>
          <h1 className="tablet:text-5xl text-4xl font-bold text-white">
            {t("website.about.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
            {t("website.about.body")}
          </p>
        </div>
      </Hero>

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <StatsSection stats={stats} />
      </section>

      <section className="tablet:grid-cols-2 mx-auto grid max-w-6xl gap-10 px-6 py-24">
        <div className="shadow-elevation1 rounded-3xl border border-neutral-100 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="bg-brand-50 text-brand dark:bg-brand-900 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Icon name="flag" size={22} />
          </span>
          <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {t("website.about.missionTitle")}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300">{t("website.about.missionBody")}</p>
        </div>
        <div className="shadow-elevation1 rounded-3xl border border-neutral-100 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="bg-brand-50 text-brand dark:bg-brand-900 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Icon name="star" size={22} />
          </span>
          <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {t("website.about.visionTitle")}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300">{t("website.about.visionBody")}</p>
        </div>
      </section>

      <section className="bg-neutral-50 py-24 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow={t("website.about.valuesEyebrow")}
            title={t("website.about.valuesTitle")}
            className="mb-12"
          />
          <div className="tablet:grid-cols-2 laptop:grid-cols-4 grid gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="shadow-elevation1 duration-normal hover:shadow-elevation3 rounded-2xl border border-neutral-100 bg-white p-6 transition-all hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="bg-brand-50 text-brand dark:bg-brand-900 mb-3 flex h-11 w-11 items-center justify-center rounded-xl">
                  <Icon name={value.icon} size={20} />
                </span>
                <h3 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">
                  {value.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24">
        <SectionHeading
          eyebrow={t("website.about.timelineEyebrow")}
          title={t("website.about.timelineTitle")}
          className="mb-14"
        />
        <div className="border-brand-100 dark:border-brand-900 relative flex flex-col gap-10 border-l-2 pl-8">
          {timeline.map((item) => (
            <div key={item.year} className="relative">
              <span className="bg-brand absolute -left-[2.55rem] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ring-4 ring-white dark:ring-neutral-950">
                •
              </span>
              <p className="text-brand text-sm font-semibold uppercase tracking-wide">
                {item.year}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {item.title}
              </h3>
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-24 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow={t("website.about.teamEyebrow")}
            title={t("website.about.teamTitle")}
            subtitle={t("website.about.teamSubtitle")}
            className="mb-12"
          />
          <div className="tablet:grid-cols-2 laptop:grid-cols-4 grid gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="shadow-elevation1 flex flex-col items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Avatar alt={member.name} fallback={member.name.charAt(0)} size="lg" />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {member.name}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
