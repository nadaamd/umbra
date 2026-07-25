import { NextResponse } from "next/server";
import { getSummary } from "@/lib/data";

// GET /api/summary → Summary  (backtest headline at τ*)
export function GET() {
  return NextResponse.json(getSummary());
}
