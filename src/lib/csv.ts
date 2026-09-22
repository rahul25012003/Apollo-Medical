/**
 * Minimal RFC4180-ish CSV parser — handles quoted fields with embedded
 * commas/quotes/newlines. Mirrors the hand-rolled writer already used in
 * registrations/export/route.ts, so no new dependency for the reverse
 * direction (bulk upload).
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  const normalized = text.replace(/^﻿/, ""); // strip BOM if present
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ",") { pushField(); continue; }
    if (c === "\r") continue;
    if (c === "\n") { pushRow(); continue; }
    field += c;
  }
  if (field.length > 0 || row.length > 0) pushRow();

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (nonEmptyRows.length === 0) return [];

  const headers = nonEmptyRows[0].map((h) => h.trim().toLowerCase());
  return nonEmptyRows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
}

type CsvCell = string | number | boolean | Date | null | undefined;

/**
 * CSV writer for admin downloads (opens cleanly in Excel): every cell quoted,
 * dates as ISO, and cells that start with = + - @ prefixed with ' so a
 * delegate-entered value can't run as a spreadsheet formula.
 */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const cell = (v: CsvCell) => {
    let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
