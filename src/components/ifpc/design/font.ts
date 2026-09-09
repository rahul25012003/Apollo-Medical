import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * Geometric grotesk font for the IFPC 2026 redesign only. Exposed as a CSS
 * variable (--font-ifpc-v2) consumed solely inside the .ifpc-v2 scope in
 * tokens.css — it never touches the site-wide default font other tenants
 * (or the rest of apollo-medical's own chrome outside .ifpc-v2) use.
 */
export const ifpcFontV2 = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ifpc-v2",
});
