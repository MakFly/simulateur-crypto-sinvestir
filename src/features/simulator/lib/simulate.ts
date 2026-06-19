import type {
  Frequency,
  PricePoint,
  ResultPoint,
  SimulationParams,
  SimulationResult,
} from "../types";

const EMPTY: SimulationResult = {
  invested: 0,
  finalValue: 0,
  profit: 0,
  roi: 0,
  coins: 0,
  contributions: 0,
  avgBuyPrice: 0,
  tax: 0,
  netValue: 0,
  netProfit: 0,
  netRoi: 0,
  contributionDates: [],
  series: [],
};

/** Nombre de jours calendaires entre deux dates ISO `yyyy-mm-dd`. */
function daysBetween(fromISO: string, toISO: string): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / day);
}

/**
 * Décide si un versement a lieu à `point`, selon la fréquence et le dernier
 * versement (`last`, `null` si aucun versement encore effectué).
 */
function shouldContribute(
  frequency: Frequency,
  point: PricePoint,
  last: PricePoint | null,
): boolean {
  if (last === null) return true; // premier versement : toujours au début de la période
  switch (frequency) {
    case "once":
      return false;
    case "daily":
      return true;
    case "weekly":
      return daysBetween(last.date, point.date) >= 7;
    case "monthly":
      // nouveau versement dès que le mois calendaire change
      return point.date.slice(0, 7) !== last.date.slice(0, 7);
  }
}

/**
 * Simule un investissement crypto en mode achat unique (`once`) ou DCA
 * (versements `daily` / `weekly` / `monthly`) sur une série de prix historiques.
 *
 * Hypothèses : achat au prix de clôture du jour, pas de frais, fractions
 * d'actif autorisées — comme le simulateur de référence sinvestir.fr.
 */
export function simulate({
  amount,
  frequency,
  prices,
  feePct = 0,
  taxPct = 0,
}: SimulationParams): SimulationResult {
  if (prices.length === 0 || amount <= 0) return EMPTY;

  const buyFactor = 1 - feePct / 100; // part du versement réellement investie
  let coins = 0;
  let invested = 0;
  let contributions = 0;
  let lastContribution: PricePoint | null = null;
  const contributionDates: string[] = [];
  const series: ResultPoint[] = [];

  for (const point of prices) {
    if (point.price > 0 && shouldContribute(frequency, point, lastContribution)) {
      coins += (amount * buyFactor) / point.price;
      invested += amount;
      contributions += 1;
      contributionDates.push(point.date);
      lastContribution = point;
    }
    series.push({
      date: point.date,
      invested,
      value: coins * point.price,
      coins,
    });
  }

  const finalValue = coins * prices[prices.length - 1].price;
  const profit = finalValue - invested;
  const tax = profit > 0 ? (profit * taxPct) / 100 : 0;
  const netValue = finalValue - tax;
  const netProfit = netValue - invested;

  return {
    invested,
    finalValue,
    profit,
    roi: invested > 0 ? profit / invested : 0,
    coins,
    contributions,
    avgBuyPrice: coins > 0 ? invested / coins : 0,
    tax,
    netValue,
    netProfit,
    netRoi: invested > 0 ? netProfit / invested : 0,
    contributionDates,
    series,
  };
}
