import { getCoin } from "./coins";
import type { PricePoint } from "../types";

const DAY = 86_400_000;

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function dedupeByDay(raw: PricePoint[]): PricePoint[] {
  const byDay = new Map<string, number>();
  for (const p of raw) if (p.price > 0) byDay.set(p.date, p.price);
  return [...byDay.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Binance klines (paire EUR, bougies journalières) — historique long (depuis
 * ~2020), gratuit. Paginé : 1000 bougies/appel.
 */
async function fromBinance(
  symbol: string,
  fromMs: number,
  toMs: number,
): Promise<PricePoint[]> {
  const out: PricePoint[] = [];
  let cursor = fromMs;
  for (let i = 0; i < 20 && cursor < toMs; i++) {
    const url =
      `https://api.binance.com/api/v3/klines?symbol=${symbol}` +
      `&interval=1d&startTime=${cursor}&endTime=${toMs}&limit=1000`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`binance ${res.status}`);
    const candles = (await res.json()) as [number, string, string, string, string][];
    if (!candles.length) break;
    for (const c of candles) out.push({ date: isoDay(c[0]), price: Number(c[4]) });
    if (candles.length < 1000) break;
    cursor = candles[candles.length - 1][0] + DAY;
  }
  return dedupeByDay(out);
}

/** CoinGecko market_chart/range — repli (palier gratuit ~365 jours). */
async function fromCoinGecko(
  coinId: string,
  fromMs: number,
  toMs: number,
): Promise<PricePoint[]> {
  const url = new URL(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range`,
  );
  url.searchParams.set("vs_currency", "eur");
  url.searchParams.set("from", String(Math.floor(fromMs / 1000)));
  url.searchParams.set("to", String(Math.floor(toMs / 1000)));

  const headers: HeadersInit = { accept: "application/json" };
  const key = process.env.COINGECKO_API_KEY;
  if (key) headers["x-cg-demo-api-key"] = key;

  const res = await fetch(url, { headers, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const json = (await res.json()) as { prices?: [number, number][] };
  return dedupeByDay(
    (json.prices ?? []).map(([ms, price]) => ({ date: isoDay(ms), price })),
  );
}

/**
 * Récupère la série de prix journaliers (EUR) d'une crypto sur une période.
 * Binance en primaire (historique long) ; CoinGecko en repli.
 * `source` indique le fournisseur réellement utilisé.
 */
export async function getPriceSeries(
  coinId: string,
  fromMs: number,
  toMs: number,
): Promise<{ source: "binance" | "coingecko" | "none"; prices: PricePoint[] }> {
  const coin = getCoin(coinId);
  if (!coin) return { source: "none", prices: [] };

  try {
    const prices = await fromBinance(`${coin.symbol}EUR`, fromMs, toMs);
    if (prices.length) return { source: "binance", prices };
  } catch {
    // bascule sur le repli
  }

  try {
    const prices = await fromCoinGecko(coinId, fromMs, toMs);
    return { source: "coingecko", prices };
  } catch {
    return { source: "none", prices: [] };
  }
}
