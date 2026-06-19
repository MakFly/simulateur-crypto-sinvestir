import { NextResponse } from "next/server";
import { getPriceSeries } from "@/features/simulator/lib/prices";
import { priceQuerySchema } from "@/features/simulator/lib/schema";

const DAY_MS = 24 * 60 * 60 * 1000;
const FLOOR_MS = Date.parse("2020-01-01"); // début de l'historique Binance EUR

/**
 * Série de prix journaliers (EUR) pour une crypto, bornée à la période demandée.
 * Multi-fournisseur : Binance (historique long) → CoinGecko (repli).
 *
 * GET /api/prices?coin=bitcoin&from=2021-01-01&to=2024-12-31
 *  - `coin` : identifiant supporté (obligatoire)
 *  - `from` / `to` : dates ISO (optionnelles ; défaut = 365 derniers jours)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = priceQuerySchema.safeParse({
    coin: searchParams.get("coin") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 },
    );
  }
  const { coin, from: fromParam, to: toParam } = parsed.data;

  const now = Date.now();
  const toMs = Math.min(parseDate(toParam) ?? now, now);
  let fromMs = parseDate(fromParam) ?? toMs - 365 * DAY_MS;
  fromMs = Math.max(fromMs, FLOOR_MS);
  if (fromMs >= toMs) fromMs = toMs - DAY_MS;

  const { source, prices } = await getPriceSeries(coin, fromMs, toMs);

  if (source === "none") {
    return NextResponse.json(
      { error: "Données de prix indisponibles pour le moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ coin, source, prices });
}

/** Parse une date ISO `yyyy-mm-dd` en ms, ou `null` si invalide. */
function parseDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}
