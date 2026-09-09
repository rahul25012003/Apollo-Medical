"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useIfpcGuard } from "@/components/ifpc/guard";
import { IfpcShell, Section } from "@/components/ifpc/IfpcShell";
import { Button } from "@/components/ui/button";
import { registrationsService, Registration } from "@/services/registrations";
import { CONFERENCE } from "@/content/ifpc-2026";
import { Printer, Loader2, LogIn, AlertTriangle } from "lucide-react";

export default function DelegateBadgePage() {
  const tenantSlug = useIfpcGuard();
  const params = useParams();
  const registrationId = params.registrationId as string;

  const [reg, setReg] = useState<Registration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registrationsService.getById(registrationId).then((res) => {
      if (res.success && res.data) {
        setReg(res.data);
      } else {
        setError(res.error?.message || "Could not load this registration.");
      }
    }).finally(() => setLoading(false));
  }, [registrationId]);

  return (
    <IfpcShell tenantSlug={tenantSlug}>
      <Section>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : error || !reg ? (
          <div className="max-w-md mx-auto text-center py-12">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-700 font-medium">{error || "Registration not found."}</p>
            <p className="text-sm text-slate-500 mt-2">You need to be logged in with the email you registered with to view your badge.</p>
            <Button asChild className="mt-5">
              <Link href={`/auth/login?tenant=${tenantSlug}`}><LogIn className="mr-2 h-4 w-4" /> Log In</Link>
            </Button>
          </div>
        ) : !reg.badgeGenerated || !reg.qrCode ? (
          <div className="max-w-md mx-auto text-center py-12">
            <p className="text-slate-700 font-medium">Your badge isn&apos;t ready yet.</p>
            <p className="text-sm text-slate-500 mt-2">
              Badges are generated once your registration is confirmed{reg.paymentStatus === "PENDING" ? " and payment is complete" : ""}. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div id="badge-print-area" className="rounded-2xl border-2 border-[hsl(var(--primary))] bg-white shadow-lg overflow-hidden">
              <div className="bg-slate-900 text-white text-center py-4">
                <p className="text-xs uppercase tracking-widest text-amber-300">{CONFERENCE.shortName}</p>
                <p className="text-sm font-serif mt-0.5">&ldquo;{CONFERENCE.theme}&rdquo;</p>
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto w-40 h-40 p-2 bg-white border-4 border-[hsl(var(--accent))] rounded-xl">
                  <QRCodeSVG value={reg.qrCode} className="w-full h-full" />
                </div>
                <h2 className="font-serif text-xl font-bold text-slate-900 mt-4">{reg.name}</h2>
                {reg.designation && <p className="text-sm text-slate-500">{reg.designation}</p>}
                {reg.organization && <p className="text-xs text-slate-400">{reg.organization}</p>}
                <span className="inline-block mt-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide bg-[hsl(var(--accent))] text-[hsl(var(--primary))]">
                  {reg.category || reg.participantRole || "Delegate"}
                </span>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <p>Registration ID: <span className="font-mono font-semibold text-slate-700">{reg.registrationCode || reg.id.slice(-8).toUpperCase()}</span></p>
                  <p>{CONFERENCE.dates} · {CONFERENCE.venueName}, {CONFERENCE.city}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center print:hidden">
              <Button size="lg" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
              </Button>
            </div>
          </div>
        )}
      </Section>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #badge-print-area, #badge-print-area * { visibility: visible; }
          #badge-print-area { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); }
        }
      `}</style>
    </IfpcShell>
  );
}
