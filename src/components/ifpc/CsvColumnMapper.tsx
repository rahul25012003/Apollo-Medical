"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export interface CsvField { key: string; label: string; required?: boolean }

export const BULK_UPLOAD_FIELDS: CsvField[] = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone" },
  { key: "organization", label: "Organization" },
  { key: "designation", label: "Designation" },
  { key: "category", label: "Category" },
  { key: "participantrole", label: "Role (Delegate/Speaker/Organizer/Volunteer/Chairperson)" },
  { key: "foodpreference", label: "Food Preference (veg/non-veg)" },
  { key: "status", label: "Status (Pending/Confirmed/Waitlist/Attended/Cancelled)" },
  { key: "paymentstatus", label: "Payment Status" },
  { key: "amount", label: "Amount" },
];

const NOT_MAPPED = "__none__";

/** Best-effort auto-match: exact, then with spaces/underscores stripped. */
function autoMatch(header: string, fields: CsvField[]): string | null {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const h = norm(header);
  const exact = fields.find((f) => norm(f.key) === h || norm(f.label) === h);
  if (exact) return exact.key;
  const partial = fields.find((f) => h.includes(norm(f.key)));
  return partial?.key ?? null;
}

/** First line of a CSV file, split on commas (good enough for a plain header row). */
export function parseCsvHeaders(text: string): string[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

/**
 * Lets the admin map their spreadsheet's own column names to the system
 * fields, so an upload isn't limited to the exact template header names —
 * unmapped columns are simply ignored.
 */
export function CsvColumnMapper({
  headers,
  fields = BULK_UPLOAD_FIELDS,
  onChange,
}: {
  headers: string[];
  fields?: CsvField[];
  onChange: (mapping: Record<string, string>) => void;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const h of headers) {
      const match = autoMatch(h, fields);
      if (match && !Object.values(initial).includes(match)) initial[h] = match;
    }
    setMapping(initial);
    onChange(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers.join("\u0001")]);

  function setFor(header: string, fieldKey: string) {
    const next = { ...mapping };
    if (fieldKey === NOT_MAPPED) delete next[header];
    else next[header] = fieldKey;
    setMapping(next);
    onChange(next);
  }

  const mappedFieldKeys = new Set(Object.values(mapping));
  const missingRequired = fields.filter((f) => f.required && !mappedFieldKeys.has(f.key));

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Label className="text-xs">Match your spreadsheet's columns to the right fields</Label>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {headers.map((h) => (
          <div key={h} className="flex items-center gap-2">
            <span className="text-xs font-medium w-32 truncate shrink-0" title={h}>{h}</span>
            <span className="text-muted-foreground text-xs">→</span>
            <Select value={mapping[h] ?? NOT_MAPPED} onValueChange={(v) => setFor(h, v)}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NOT_MAPPED}>Don&apos;t import</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f.key} value={f.key} disabled={mappedFieldKeys.has(f.key) && mapping[h] !== f.key}>
                    {f.label}{f.required ? " *" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      {missingRequired.length === 0 ? (
        <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Name and Email are mapped</p>
      ) : (
        <p className="text-xs text-destructive">Map a column to: {missingRequired.map((f) => f.label).join(", ")}</p>
      )}
    </div>
  );
}

/** Rewrites a CSV's header row to the canonical field names per the mapping, dropping unmapped columns. */
export function remapCsvHeaders(csvText: string, mapping: Record<string, string>): string {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return csvText;
  const headers = parseCsvHeaders(csvText);
  lines[0] = headers.map((h) => (mapping[h] ? `"${mapping[h]}"` : `"${h}"`)).join(",");
  return lines.join("\n");
}
