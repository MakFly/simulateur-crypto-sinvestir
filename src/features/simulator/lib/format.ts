const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurPrecise = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** Montant en euros, sans décimales (ex. `1 234 €`). */
export function formatEUR(value: number): string {
  return eur.format(value);
}

/** Montant en euros avec 2 décimales (petits montants / prix). */
export function formatEURPrecise(value: number): string {
  return eurPrecise.format(value);
}

/** Ratio formaté en pourcentage signé (ex. `+42,1 %`). */
export function formatPercent(ratio: number): string {
  return pct.format(ratio);
}

/** Quantité d'actif avec un nombre de décimales adapté à l'ordre de grandeur. */
export function formatCoins(value: number, symbol: string): string {
  const digits = value >= 1 ? 4 : 8;
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: digits })} ${symbol}`;
}
