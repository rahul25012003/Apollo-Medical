"use client";

import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

/**
 * A4 poster: emblem, title, a large QR and the address in plain text beneath
 * it for anyone whose camera won't scan. High error correction so a creased,
 * glare-struck or partly covered print still reads.
 */
export function SchedulePoster({ url }: { url: string }) {
  const shown = url.replace(/^https?:\/\//, "");
  return (
    <div className="ifpc-poster-page">
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        .ifpc-poster-page { min-height: 100vh; background: #eef2f6; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; gap: 16px; }
        .ifpc-poster { width: 100%; max-width: 186mm; aspect-ratio: 210 / 297; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgb(15 23 42 / 0.12); display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; padding: 14mm 12mm; color: #0f172a; }
        @media print {
          .ifpc-poster-page { background: #fff; padding: 0; min-height: auto; }
          .ifpc-poster { box-shadow: none; border-radius: 0; max-width: none; height: 273mm; aspect-ratio: auto; }
          .ifpc-no-print { display: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={() => window.print()}
        className="ifpc-no-print inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
      >
        <Printer className="h-4 w-4" /> Print poster
      </button>

      <div className="ifpc-poster">
        <div className="flex flex-col items-center gap-3">
          <img src="/ifpc/ifpc-icon-512.png" alt="IFPC 2026 emblem" width={96} height={96} className="h-24 w-24 rounded-2xl object-cover" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">International Forensic Psychiatry Conference 2026</p>
          <h1 className="text-5xl font-extrabold tracking-tight">Conference Schedule</h1>
          <p className="text-lg text-slate-600">Scan to see today&apos;s sessions, halls and timings</p>
        </div>

        <div className="rounded-2xl border-4 border-slate-900 p-5">
          <QRCodeSVG value={url} size={420} level="H" marginSize={2} style={{ width: "100mm", height: "100mm" }} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-base text-slate-500">Or open</p>
          <p className="break-all text-2xl font-bold">{shown}</p>
          <p className="mt-3 text-sm text-slate-500">NIMHANS Convention Centre, Bengaluru · 2–5 November 2026</p>
        </div>
      </div>
    </div>
  );
}
