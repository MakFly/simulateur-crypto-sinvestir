import type { BenchmarkSeries, PricePoint } from "../types";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Actifs de référence cotés en EUR (tickers Yahoo Finance). */
export const BENCHMARK_ASSETS: { key: string; label: string; symbol: string }[] = [
  { key: "msci", label: "ETF MSCI World", symbol: "EUNL.DE" }, // iShares Core MSCI World UCITS (EUR)
  { key: "gold", label: "Or", symbol: "4GLD.DE" }, // Xetra-Gold (EUR)
];

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const YAHOO_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];

/** Série journalière (EUR) d'un actif via Yahoo Finance (chart v8). */
async function fetchYahoo(
  symbol: string,
  fromMs: number,
  toMs: number,
): Promise<PricePoint[]> {
  const qs =
    `?period1=${Math.floor(fromMs / 1000)}&period2=${Math.floor(toMs / 1000)}&interval=1d`;

  // bascule entre les deux hôtes Yahoo si l'un rate-limite (429)
  let res: Response | null = null;
  for (const host of YAHOO_HOSTS) {
    res = await fetch(`${host}/v8/finance/chart/${symbol}${qs}`, {
      headers: { "User-Agent": UA, accept: "application/json" },
      next: { revalidate: 21600 }, // cache 6 h : ~8 appels/jour max
    });
    if (res.ok) break;
  }
  if (!res || !res.ok) throw new Error(`yahoo ${res?.status ?? "fetch"}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const ts: number[] = result?.timestamp ?? [];
  const adj: (number | null)[] | undefined =
    result?.indicators?.adjclose?.[0]?.adjclose;
  const close: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
  const values = adj ?? close;

  const out: PricePoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const price = values[i];
    if (price != null && price > 0) out.push({ date: isoDay(ts[i] * 1000), price });
  }
  return out;
}

/**
 * Récupère les séries de prix réelles des actifs de référence sur la période.
 * Un actif qui échoue (rate-limit, indispo) est simplement omis — la
 * comparaison reste fonctionnelle avec le Livret A (calculé hors réseau).
 */
export async function getBenchmarkSeries(
  fromMs: number,
  toMs: number,
): Promise<BenchmarkSeries[]> {
  const settled = await Promise.allSettled(
    BENCHMARK_ASSETS.map(async (a) => ({
      key: a.key,
      label: a.label,
      prices: await fetchYahoo(a.symbol, fromMs, toMs),
    })),
  );

  return settled
    .filter(
      (s): s is PromiseFulfilledResult<BenchmarkSeries> =>
        s.status === "fulfilled" && s.value.prices.length > 0,
    )
    .map((s) => s.value);
}
