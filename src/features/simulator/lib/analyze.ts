import { simulate } from "./simulate";
import type {
  Benchmark,
  PricePoint,
  RiskMetrics,
  SimulationParams,
  SimulationResult,
} from "../types";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/** Placements de référence à taux fixe (illustratifs, annualisés). */
const BENCHMARKS: { key: string; label: string; rate: number }[] = [
  { key: "livretA", label: "Livret A", rate: 0.03 },
  { key: "etfWorld", label: "ETF World", rate: 0.08 },
];

export interface Analysis {
  main: SimulationResult;
  /** Même montant total investi en une fois au départ (null si déjà "once"). */
  lumpSum: SimulationResult | null;
  benchmarks: Benchmark[];
  risk: RiskMetrics;
}

/**
 * Valeur finale du même échéancier de versements placé à un taux annuel fixe
 * (intérêts composés). Sert de comparatif d'opportunité (Livret A, ETF…).
 */
export function benchmarkValue(
  contributionDates: string[],
  amountPerContribution: number,
  endISO: string,
  annualRate: number,
): number {
  const end = Date.parse(endISO);
  if (Number.isNaN(end)) return 0;
  let total = 0;
  for (const date of contributionDates) {
    const years = Math.max(0, (end - Date.parse(date)) / YEAR_MS);
    total += amountPerContribution * Math.pow(1 + annualRate, years);
  }
  return total;
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

/** Analyse complète : simulation choisie + lump-sum + benchmarks + risque. */
export function analyze(params: SimulationParams): Analysis {
  const main = simulate(params);

  const lumpSum =
    params.frequency === "once"
      ? null
      : simulate({ ...params, amount: main.invested, frequency: "once" });

  const endISO = params.prices.at(-1)?.date ?? "";
  const benchmarks = main.contributionDates.length
    ? BENCHMARKS.map((b) => {
        const finalValue = benchmarkValue(
          main.contributionDates,
          params.amount,
          endISO,
          b.rate,
        );
        return {
          ...b,
          finalValue,
          roi: main.invested > 0 ? (finalValue - main.invested) / main.invested : 0,
        };
      })
    : [];

  return { main, lumpSum, benchmarks, risk: computeRisk(params.prices) };
}
