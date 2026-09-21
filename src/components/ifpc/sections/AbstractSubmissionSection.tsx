import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { ABSTRACT_SUBMISSION } from "@/content/ifpc-2026";

// "Submit Your Abstract" (deadline, guidelines, submission form) was removed
// from the home page per request. The presentation/poster/symposia guidelines
// and awards have their own headings and stay. The /api/abstracts endpoints
// and admin review flow are untouched.
export function AbstractSubmissionSection() {
  return (
    <>
      <Section tint>
        <SectionTitle title={ABSTRACT_SUBMISSION.oralGuidelines.title} />
        <ul className="space-y-2 mb-10">
          {ABSTRACT_SUBMISSION.oralGuidelines.items.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>

        <SectionTitle title={ABSTRACT_SUBMISSION.posterGuidelines.title} />
        <div className="grid sm:grid-cols-3 gap-4">
          {[ABSTRACT_SUBMISSION.posterGuidelines.technical, ABSTRACT_SUBMISSION.posterGuidelines.layout, ABSTRACT_SUBMISSION.posterGuidelines.onSite].map((block) => (
            <div key={block.title} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <h4 className="font-bold text-sm mb-2">{block.title}</h4>
              <ul className="space-y-1">
                {block.items.map((it, i) => <li key={i} className="text-xs opacity-65 leading-relaxed">{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle title={ABSTRACT_SUBMISSION.symposiaGuidelines.title} />
        <ul className="space-y-2 mb-10">
          {ABSTRACT_SUBMISSION.symposiaGuidelines.items.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>

        <SectionTitle title={ABSTRACT_SUBMISSION.awards.title} />
        <ul className="space-y-2">
          {ABSTRACT_SUBMISSION.awards.items.map((g, i) => (
            <li key={i} className="text-sm opacity-75 pl-4 relative before:content-['•'] before:absolute before:left-0">{g}</li>
          ))}
        </ul>
      </Section>
    </>
  );
}
