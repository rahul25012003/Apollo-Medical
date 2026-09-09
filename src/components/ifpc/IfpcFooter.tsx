import Link from "next/link";
import { Linkedin, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { FOOTER_QUICK_LINKS, FOOTER, CONTACT, CONFERENCE } from "@/content/ifpc-2026";

export function IfpcFooter({ tenantSlug }: { tenantSlug: string }) {
  const base = `/t/${tenantSlug}`;

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1 overflow-hidden">
              <img src="/ifpc/nimhans-logo.png" alt="NIMHANS" className="h-full w-full object-contain" />
            </span>
            <span className="font-serif font-bold text-white leading-tight">IFPC 2026</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{FOOTER.tagline}</p>
          <p className="text-sm text-slate-400 mt-3">{CONFERENCE.hostsLong}</p>
          <div className="flex items-center gap-3 mt-5">
            <a href={CONTACT.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href={CONTACT.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={CONTACT.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            {FOOTER_QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={`${base}${l.href}`} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 flex-none text-slate-500" />
              <a href={`mailto:${CONTACT.generalEmail}`} className="hover:text-white transition-colors break-all">{CONTACT.generalEmail}</a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 flex-none text-slate-500" />
              <span>{CONTACT.conferenceManager.name}, {CONTACT.conferenceManager.mobile}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-none text-slate-500" />
              <span>{CONTACT.venueAddress}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Hosts</h4>
          <p className="text-sm text-slate-400">{CONFERENCE.hostsLong}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-xs text-slate-500 text-center">
          {FOOTER.copyright}
        </div>
      </div>
    </footer>
  );
}
