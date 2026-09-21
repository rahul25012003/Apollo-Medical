"use client";

import { useParams } from "next/navigation";
import { useIsIfpcEventId } from "@/components/ifpc/guard";
import IfpcPage from "./ifpc-page";
import LegacyPage from "./legacy-page";

// IFPC (apollo-medical) gets the current page. Every other tenant keeps the
// original pre-IFPC page, unchanged, in ./legacy-page.tsx.
export default function Page() {
    const params = useParams();
    const { isIfpc, loading } = useIsIfpcEventId(typeof params.id === "string" ? params.id : undefined);
    if (loading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>;
    }
    return isIfpc ? <IfpcPage /> : <LegacyPage />;
}
