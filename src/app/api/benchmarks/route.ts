import { NextResponse } from "next/server";
import { getBenchmarkSeries } from "@/features/simulator/lib/benchmarks";

const DAY_MS = 24 * 60 * 60 * 1000;
const FLOOR_MS = Date.parse("2020-01-01");

/**
 * Séries de prix réelles des actifs de référence (ETF MSCI World, Or) en EUR,
 * sur la période demandée. Sert au backtest comparatif côté client.
 *
 * GET /api/benchmarks?from=2021-01-01&to=2024-12-31
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = Date.now();
  const toMs = Math.min(parseDate(searchParams.get("to")) ?? now, now);
  let fromMs = parseDate(searchParams.get("from")) ?? toMs - 365 * DAY_MS;
  fromMs = Math.max(fromMs, FLOOR_MS);
  if (fromMs >= toMs) fromMs = toMs - DAY_MS;

  const benchmarks = await getBenchmarkSeries(fromMs, toMs);
  return NextResponse.json({ benchmarks });
}

function parseDate(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}
