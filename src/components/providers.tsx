"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "sonner";

// The session is hydrated server-side (see layout.tsx) and passed in here,
// so useSession() resolves correctly on the very first client render —
// including a hard refresh — instead of starting "loading" and briefly
// rendering with no known tenant while it fetches /api/auth/session.
export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster richColors position="top-right" />
    </SessionProvider>
  );
}
