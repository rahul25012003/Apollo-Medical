"use client";

import Image from "next/image";
import { useIfpcEvent } from "@/components/ifpc/useIfpcEvent";
import { Section, SectionTitle } from "@/components/ifpc/IfpcShell";
import { SPEAKERS_INTRO, SPEAKERS_NOTE } from "@/content/ifpc-2026";
import { User, Loader2, Building2, Mic2 } from "lucide-react";
import { IfpcCard } from "@/components/ifpc/IfpcCard";


export function SpeakersSection() {
  const { event, loading } = useIfpcEvent();

  const speakers = (event?.eventSpeakers || [])
    .filter((es) => es.isPublished)
    .slice()
    .sort((a, b) => (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0));

  return (
    <Section tint>
      <SectionTitle title="Speakers & Resource Persons" subtitle={SPEAKERS_INTRO} />
      {loading ? (
        <div className="flex justify-center py-10 opacity-50"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : speakers.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {speakers.map((es) => (
            <IfpcCard
              key={es.id}
              avatar={es.speaker.photo
                ? <Image src={es.speaker.photo} alt={es.speaker.name} width={64} height={64} />
                : <User className="h-7 w-7" />}
              title={es.speaker.name}
              tagline={es.speaker.designation || undefined}
              meta={[
                ...(es.speaker.institution ? [{ icon: Building2, text: es.speaker.institution }] : []),
                ...(es.topic ? [{ icon: Mic2, text: es.topic }] : []),
              ]}
            />
          ))}
        </div>
      ) : (
        <p className="text-center opacity-45 text-sm py-10">Speaker list will be announced soon.</p>
      )}
      <p className="mt-10 text-center text-sm opacity-50 italic">{SPEAKERS_NOTE}</p>
    </Section>
  );
}
