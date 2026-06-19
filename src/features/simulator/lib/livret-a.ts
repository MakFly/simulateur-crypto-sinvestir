const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Barème officiel du taux du Livret A (source : Banque de France /
 * service-public.fr). Chaque entrée prend effet à la date indiquée.
 */
const RATE_SCHEDULE: { from: string; rate: number }[] = [
  { from: "2015-08-01", rate: 0.0075 },
  { from: "2020-02-01", rate: 0.005 },
  { from: "2022-02-01", rate: 0.01 },
  { from: "2022-08-01", rate: 0.02 },
  { from: "2023-02-01", rate: 0.03 },
  { from: "2025-02-01", rate: 0.024 },
  { from: "2025-08-01", rate: 0.017 },
];

/** Capitalise un versement de `from` à `to` en suivant le barème réel du Livret A. */
function compound(fromMs: number, toMs: number, amount: number): number {
  let value = amount;
  for (let i = 0; i < RATE_SCHEDULE.length; i++) {
    const segStart = Date.parse(RATE_SCHEDULE[i].from);
    const segEnd =
      i + 1 < RATE_SCHEDULE.length
        ? Date.parse(RATE_SCHEDULE[i + 1].from)
        : Number.POSITIVE_INFINITY;
    const start = Math.max(fromMs, segStart);
    const end = Math.min(toMs, segEnd);
    if (end > start) {
      const years = (end - start) / YEAR_MS;
      value *= Math.pow(1 + RATE_SCHEDULE[i].rate, years);
    }
  }
  return value;
}

/**
 * Valeur finale du même échéancier de versements placé sur un Livret A, au
 * taux réglementé réel en vigueur à chaque période (intérêts composés).
 */
export function livretAValue(
  contributionDates: string[],
  amountPerContribution: number,
  endISO: string,
): number {
  const end = Date.parse(endISO);
  if (Number.isNaN(end)) return 0;
  let total = 0;
  for (const date of contributionDates) {
    total += compound(Date.parse(date), end, amountPerContribution);
  }
  return total;
}
