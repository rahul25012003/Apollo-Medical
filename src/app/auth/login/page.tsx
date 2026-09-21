"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import IfpcLoginPage from "./ifpc-login-page";
import LegacyLoginPage from "./legacy-login-page";

// IFPC (apollo-medical) has its own password-only login page. Every other
// tenant keeps the original page (OTP + admin login), unchanged.
function LoginSwitch() {
    const tenant = useSearchParams().get("tenant");
    return tenant === IFPC_TENANT_SLUG ? <IfpcLoginPage /> : <LegacyLoginPage />;
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>}>
            <LoginSwitch />
        </React.Suspense>
    );
}
