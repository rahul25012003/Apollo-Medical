"use client";

import Link from "next/link";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { Button } from "@/components/ui/button";
import { HIGHLIGHTS, CTA_LINKS } from "@/content/ifpc-2026";
import { Sparkles, ArrowRight, Tent } from "lucide-react";
import { format } from "date-fns";

const BADGE_COLORS = ["#4B2FE5", "#1e3a5f", "#CCFF33"];

export function HighlightsSection() {
  const { event } = useIfpcEvent();
  const hasEnded = !!event?.endDate && new Date(event.endDate) < new Date();

  return (
    <>
      <Section>
        <div className="grid lg:grid-cols-12 gap-2 lg:gap-12">
          <div className="lg:col-span-4">
            <SectionTitle title={HIGHLIGHTS.scientific.title} subtitle={HIGHLIGHTS.intro} />
            <a
              href={CTA_LINKS.viewProgramme.href}
              className="-mt-4 mb-8 lg:mb-0 inline-flex items-center gap-2 rounded-full border-2 border-[#4B2FE5] px-5 py-2.5 text-sm font-bold text-[#4B2FE5] transition-colors hover:bg-[#4B2FE5] hover:text-white"
            >
              {CTA_LINKS.viewProgramme.label} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <ol className="lg:col-span-8 divide-y divide-slate-200 border-y border-slate-200">
            {HIGHLIGHTS.scientific.items.map((item, i) => (
              <li key={i} className="flex gap-4 sm:gap-6 py-5">
                <span className="w-9 sm:w-11 flex-none text-2xl sm:text-3xl font-extrabold tabular-nums leading-none text-[#4B2FE5]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] sm:text-base leading-relaxed opacity-80">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {event?.startDate && !hasEnded && (
        <Section tint>
          <div className="rounded-2xl bg-slate-900 text-white p-8 max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-2">{HIGHLIGHTS.preConference.title}</p>
            <p className="text-slate-200 leading-relaxed">
              Hands-on workshops on {format(new Date(event.startDate), "d MMMM yyyy")}, led by national and international experts, offering interactive sessions designed to bridge psychiatry and the justice system effectively.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Seat availability for individual workshops is tracked live on the{" "}
              <a href="#programme" className="text-amber-300 underline underline-offset-2">Scientific Programme</a> section below.
            </p>
          </div>
        </Section>
      )}

      <Section>
        <SectionTitle title={HIGHLIGHTS.delegateExperience.title} />
        <div className="grid sm:grid-cols-2 gap-5">
          {HIGHLIGHTS.delegateExperience.items.map((item, i) => (
            <div
              key={item.title}
              className={`rounded-xl border border-slate-200 bg-white shadow-sm relative p-5 pt-6 ${i % 4 === 1 ? "" : i % 4 === 3 ? "" : ""}`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white absolute -top-3 -left-3" style={{ background: BADGE_COLORS[i % BADGE_COLORS.length] }}>
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-bold pl-2 mb-1.5">{item.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed pl-2">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <a href="#registration">{CTA_LINKS.registerNow.label} <ArrowRight className="ml-2 h-4 w-4 inline" /></a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
            <a href="#programme">{CTA_LINKS.viewProgramme.label}</a>
          </Button>
        </div>
      </Section>
    </>
  );
}
