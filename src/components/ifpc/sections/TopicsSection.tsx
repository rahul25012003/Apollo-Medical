import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { Button } from "@/components/ui/button";
import { TOPICS_INTRO, TOPIC_CATEGORIES, CTA_LINKS } from "@/content/ifpc-2026";
import { ListChecks, ArrowRight } from "lucide-react";

const BADGE_COLORS = ["#4B2FE5", "#1e3a5f", "#CCFF33"];

export function TopicsSection() {
  return (
    <Section tint>
      <SectionTitle title="Thematic Topics" subtitle={TOPICS_INTRO} />
      <div className="grid sm:grid-cols-2 gap-6">
        {TOPIC_CATEGORIES.map((cat, i) => (
          <div key={cat.title} className="rounded-xl border border-slate-200 bg-white shadow-sm relative p-5 pt-6">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white absolute -top-3 -left-3" style={{ background: BADGE_COLORS[i % BADGE_COLORS.length], color: i % 3 === 2 ? "#0a0a0a" : "#fff" }}>
              <ListChecks className="h-4 w-4" />
            </span>
            <h3 className="font-bold pl-2 mb-3">{cat.title}</h3>
            <ul className="space-y-1.5 pl-2">
              {cat.items.map((item) => (
                <li key={item} className="text-sm opacity-70 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0" style={{ color: "inherit" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg" className="h-12 px-8 text-base">
          <a href="#abstract">{CTA_LINKS.submitAbstract.label} <ArrowRight className="ml-2 h-4 w-4 inline" /></a>
        </Button>
      </div>
    </Section>
  );
}
