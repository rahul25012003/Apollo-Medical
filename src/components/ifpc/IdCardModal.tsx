"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { CONFERENCE } from "@/content/ifpc-2026";

interface IdCardRegistration {
    id: string;
    name?: string;
    designation?: string | null;
    organization?: string | null;
    category?: string | null;
    participantRole?: string | null;
    registrationCode?: string | null;
    photo?: string | null;
    qrCode?: string | null;
    badgeGenerated?: boolean;
}

/** In-app ID Card / QR Code — a compact modal so delegates never leave the dashboard to find their badge. */
export function IdCardModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [reg, setReg] = useState<IdCardRegistration | null | undefined>(undefined);

    useEffect(() => {
        if (!open || reg !== undefined) return;
        fetch("/api/users/me/registrations")
            .then((r) => r.json())
            .then((j) => {
                const regs: IdCardRegistration[] = Array.isArray(j?.data) ? j.data : [];
                setReg(regs.find((r) => r.badgeGenerated && r.qrCode) ?? null);
            })
            .catch(() => setReg(null));
    }, [open, reg]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-teal-600" /> Your ID Card
                    </DialogTitle>
                    <DialogDescription>Your conference QR code for check-in and access.</DialogDescription>
                </DialogHeader>

                {reg === undefined ? (
                    <div className="flex justify-center py-10 text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : !reg ? (
                    <div className="py-6 text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Your badge isn&apos;t ready yet.</p>
                        <p className="text-xs text-slate-500 mt-1.5">Badges are generated once your registration is confirmed. Check back shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl border-2 border-teal-100 shadow-sm overflow-hidden mx-auto w-full max-w-[280px]">
                            <div className="bg-slate-900 text-white text-center py-2.5">
                                <p className="text-[10px] uppercase tracking-widest text-teal-300">{CONFERENCE.shortName}</p>
                            </div>
                            <div className="p-5 text-center">
                                {reg.photo && (
                                    <img
                                        src={reg.photo}
                                        alt={reg.name || "Delegate"}
                                        className="mx-auto w-16 h-16 rounded-full object-cover border-2 border-teal-100 -mt-1 mb-2"
                                    />
                                )}
                                <div className="mx-auto w-36 h-36 p-2 bg-white border-2 border-teal-100 rounded-lg">
                                    <QRCodeSVG value={reg.qrCode as string} className="w-full h-full" />
                                </div>
                                <p className="font-bold text-sm mt-3 truncate">{reg.name || "Delegate"}</p>
                                {reg.designation && <p className="text-xs text-slate-500 truncate">{reg.designation}</p>}
                                {reg.organization && <p className="text-[10px] text-slate-400 truncate">{reg.organization}</p>}
                                <span className="inline-block mt-2 rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-teal-100 text-teal-700">
                                    {reg.category || reg.participantRole || "Delegate"}
                                </span>
                                <p className="text-[9px] text-muted-foreground font-mono mt-2">
                                    {reg.registrationCode || reg.id.slice(-8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground text-center">Show this QR code at the venue for check-in and access.</p>
                    </>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
