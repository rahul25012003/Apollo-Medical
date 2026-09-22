"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpNextMessage } from "@/lib/ifpc-eoi";

const TONE_DOT: Record<UpNextMessage["tone"], string> = {
    now: "bg-rose-500 animate-pulse",
    soon: "bg-amber-500",
    today: "bg-emerald-500",
    next: "bg-slate-400",
};

interface GeneralNotification {
    title: string;
    message: string;
    link: string | null;
}

/** In-app notifications list — a compact overlay so "+N more" never navigates away from the dashboard. */
export function NotificationsModal({
    open,
    onOpenChange,
    sessionNotices,
    generalNotifications,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionNotices: UpNextMessage[];
    generalNotifications: GeneralNotification[];
}) {
    const isEmpty = sessionNotices.length === 0 && generalNotifications.length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-600" /> Notifications
                    </DialogTitle>
                    <DialogDescription>Everything new, in one place.</DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1 space-y-4">
                    {sessionNotices.length > 0 && (
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Your sessions</p>
                            <ul className="space-y-2">
                                {sessionNotices.map((m) => (
                                    <li key={m.sessionId + m.tone}>
                                        <Link
                                            href="/dashboard/my-interests"
                                            onClick={() => onOpenChange(false)}
                                            className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2.5 transition-colors"
                                        >
                                            <span className={cn("h-2.5 w-2.5 rounded-full flex-none", TONE_DOT[m.tone])} />
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{m.text}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {generalNotifications.length > 0 && (
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Announcements</p>
                            <ul className="space-y-2">
                                {generalNotifications.map((n, i) => {
                                    const body = (
                                        <>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                        </>
                                    );
                                    return (
                                        <li key={i}>
                                            {n.link ? (
                                                <Link
                                                    href={n.link}
                                                    onClick={() => onOpenChange(false)}
                                                    className="block rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2.5 transition-colors"
                                                >
                                                    {body}
                                                </Link>
                                            ) : (
                                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2.5">{body}</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {isEmpty && (
                        <p className="text-sm text-center text-slate-500 py-8">You&apos;re all caught up — nothing new right now.</p>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
