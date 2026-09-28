import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { SchedulePoster } from "./SchedulePoster";

/**
 * Printable A4 poster whose QR opens the Schedule page. The address is built
 * from the host this page is opened on, so printing it from the live domain
 * encodes the live domain. Where the tenant is served at the site root (as in
 * production) the short /schedule path is used — fewer characters make a
 * less dense code that scans more reliably from a distance.
 */
export default async function ScheduleQrPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  if (tenant !== IFPC_TENANT_SLUG) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const atRoot = process.env.DEFAULT_TENANT_SLUG === tenant;
  const url = `${proto}://${host}${atRoot ? "/schedule" : `/t/${tenant}/schedule`}`;

  return <SchedulePoster url={url} />;
}
