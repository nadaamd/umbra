import { NextResponse } from "next/server";
import { getSeries } from "@/lib/data";

// GET /api/cbri/series → CbriPoint[]  (full replay panel)
// LIVE: proxy the quant backend's CBRI stream (The Graph → features.py).
export function GET() {
  return NextResponse.json(getSeries());
}
