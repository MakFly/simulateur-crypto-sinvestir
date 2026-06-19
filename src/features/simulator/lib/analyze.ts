import { livretAValue } from "./livret-a";
import { simulate } from "./simulate";
import type {
  Benchmark,
  BenchmarkSeries,
  PricePoint,
  RiskMetrics,
  SimulationParams,
  SimulationResult,
} from "../types";

export interface Analysis {
  main: SimulationResult;
  /** Même montant total investi en une fois au départ (null si déjà "once"). */
  lumpSum: SimulationResult | null;
  benchmarks: Benchmark[];
  risk: RiskMetrics;
}

/** Dernier prix connu à une date donnée (recherche dichotomique, séries triées). */
function priceOnOrBefore(prices: PricePoint[], dateISO: string): number | null {
  let lo = 0;
  let hi = prices.length - 1;
  let ans: number | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (prices[mid].date <= dateISO) {
      ans = prices[mid].price;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  // si la 1re date du benchmark est postérieure, on prend ce premier prix
  return ans ?? prices[0]?.price ?? null;
}

/**
 * Backtest réel : achète des parts de l'actif de référence aux mêmes dates de
 * versement que la simulation crypto, puis valorise au dernier prix.
 */
function backtestBenchmark(
  prices: PricePoint[],
  contributionDates: string[],
  amount: number,
): { finalValue: number; roi: number } {
  if (prices.length === 0 || contributionDates.length === 0) {
    return { finalValue: 0, roi: 0 };
  }
  let units = 0;
  let invested = 0;
  for (const date of contributionDates) {
    const price = priceOnOrBefore(prices, date);
    if (price && price > 0) {
      units += amount / price;
      invested += amount;
    }
  }
  const finalValue = units * prices[prices.length - 1].price;
  return {
    finalValue,
    roi: invested > 0 ? (finalValue - invested) / invested : 0,
  };
}

/**
 * Indicateurs de risque de l'actif sous-jacent (sur les prix, pas le
 * portefeuille) : plus forte baisse depuis un sommet + volatilité annualisée.
 */
export function computeRisk(prices: PricePoint[]): RiskMetrics {
  let peak = 0;
  let maxDrawdown = 0;
  const returns: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    const p = prices[i].price;
    if (p > peak) peak = p;
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (p - peak) / peak);
    if (i > 0) {
      const prev = prices[i - 1].price;
      if (prev > 0 && p > 0) returns.push(p / prev - 1);
    }
  }

  const n = returns.length || 1;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const volatility = Math.sqrt(variance) * Math.sqrt(365);

  return { maxDrawdown, volatility };
}

/**
 * Analyse complète : simulation choisie + lump-sum + comparatifs réels
 * (backtest sur les séries d'actifs de référence + Livret A réglementé) + risque.
 */
export function analyze(
  params: SimulationParams,
  benchmarkSeries: BenchmarkSeries[] = [],
): Analysis {
  const main = simulate(params);

  const lumpSum =
    params.frequency === "once"
      ? null
      : simulate({ ...params, amount: main.invested, frequency: "once" });

  const endISO = params.prices.at(-1)?.date ?? "";
  const dates = main.contributionDates;
  const invested = main.invested;

  const benchmarks: Benchmark[] = [];
  if (dates.length > 0) {
    for (const b of benchmarkSeries) {
      const { finalValue, roi } = backtestBenchmark(b.prices, dates, params.amount);
      if (finalValue > 0) benchmarks.push({ key: b.key, label: b.label, finalValue, roi });
    }
    const livretA = livretAValue(dates, params.amount, endISO);
    benchmarks.push({
      key: "livretA",
      label: "Livret A",
      finalValue: livretA,
      roi: invested > 0 ? (livretA - invested) / invested : 0,
    });
  }

  return { main, lumpSum, benchmarks, risk: computeRisk(params.prices) };
}
