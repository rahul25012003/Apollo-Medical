import { NextResponse } from "next/server";

/** File download for a CSV string; the BOM makes Excel read it as UTF-8 (₹, names). */
export function csvResponse(filename: string, csv: string): NextResponse {
  const safeName = filename.replace(/[^\w.-]+/g, "-");
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "no-store",
    },
  });
}
