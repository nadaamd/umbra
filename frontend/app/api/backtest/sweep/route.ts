import { NextResponse } from "next/server";
import { getSweep, getSummary } from "@/lib/data";

// GET /api/backtest/sweep → { sweep: SweepRow[], summary: Summary }
// LIVE: proxy backtest.py's τ-sweep + τ* selection.
export function GET() {
  return NextResponse.json({ sweep: getSweep(), summary: getSummary() });
}
