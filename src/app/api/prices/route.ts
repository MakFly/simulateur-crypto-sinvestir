import { NextResponse } from "next/server";
import { priceQuerySchema } from "@/features/simulator/lib/schema";
import type { PricePoint } from "@/features/simulator/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 365; // limite de l'historique gratuit CoinGecko

/**
 * Proxy CoinGecko (clé d'API masquée côté serveur) renvoyant une série de prix
 * journaliers en EUR pour une crypto donnée, bornée à la période demandée.
 *
 * GET /api/prices?coin=bitcoin&from=2024-01-01&to=2024-12-31
 *  - `coin` : identifiant CoinGecko (obligatoire, doit être supporté)
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
  const toMs = clampMs(parseDate(toParam) ?? now, now);
  const fromDefault = toMs - MAX_DAYS * DAY_MS;
  let fromMs = parseDate(fromParam) ?? fromDefault;

  // borne l'historique à MAX_DAYS (contrainte free tier) et garde from < to
  fromMs = Math.max(fromMs, toMs - MAX_DAYS * DAY_MS);
  if (fromMs >= toMs) fromMs = toMs - DAY_MS;

  const url = new URL(
    `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range`,
  );
  url.searchParams.set("vs_currency", "eur");
  url.searchParams.set("from", String(Math.floor(fromMs / 1000)));
  url.searchParams.set("to", String(Math.floor(toMs / 1000)));

  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: HeadersInit = { accept: "application/json" };
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers,
      // cache CoinGecko 1h : limite les appels et le rate-limit
      next: { revalidate: 3600 },
    });
  } catch {
    return NextResponse.json(
      { error: "Service de prix indisponible." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Données indisponibles (CoinGecko ${upstream.status}).` },
      { status: 502 },
    );
  }

  const json = (await upstream.json()) as { prices?: [number, number][] };
  const prices = dedupeByDay(json.prices ?? []);

  return NextResponse.json({ coin, prices });
}

/** Parse une date ISO `yyyy-mm-dd` en ms, ou `null` si invalide. */
function parseDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function clampMs(ms: number, max: number): number {
  return Math.min(ms, max);
}

/** Réduit la série CoinGecko (pas horaire/minute possible) à un point par jour. */
function dedupeByDay(raw: [number, number][]): PricePoint[] {
  const byDay = new Map<string, number>();
  for (const [ms, price] of raw) {
    const date = new Date(ms).toISOString().slice(0, 10);
    byDay.set(date, price); // conserve le dernier prix connu du jour
  }
  return [...byDay.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
