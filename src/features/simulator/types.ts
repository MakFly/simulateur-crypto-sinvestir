/** Fréquence de versement (logique reprise du simulateur crypto S'investir). */
export type Frequency = "once" | "daily" | "weekly" | "monthly";

/** Un prix de clôture journalier, en EUR. */
export interface PricePoint {
  /** Date ISO `yyyy-mm-dd`. */
  date: string;
  /** Prix de l'actif ce jour-là, en EUR. */
  price: number;
}

export interface SimulationParams {
  /** Montant d'un versement (ou montant unique si `frequency === "once"`), en EUR. */
  amount: number;
  frequency: Frequency;
  /** Série de prix journaliers, triée par date croissante, déjà bornée à la période. */
  prices: PricePoint[];
  /** Frais d'achat en % appliqués à chaque versement (défaut 0). */
  feePct?: number;
  /** Fiscalité en % appliquée à la plus-value finale (défaut 0 ; PFU FR = 30). */
  taxPct?: number;
}

/** Point de la courbe d'évolution renvoyée au graphe. */
export interface ResultPoint {
  date: string;
  /** Cumul investi à cette date. */
  invested: number;
  /** Valeur du portefeuille à cette date. */
  value: number;
  /** Quantité d'actif cumulée détenue à cette date. */
  coins: number;
}

export interface SimulationResult {
  /** Total réellement investi sur la période. */
  invested: number;
  /** Valeur du portefeuille à la dernière date. */
  finalValue: number;
  /** `finalValue - invested` (peut être négatif). */
  profit: number;
  /** Rendement : `profit / invested` (ratio, ex. 0.42 = +42 %). */
  roi: number;
  /** Quantité d'actif cumulée. */
  coins: number;
  /** Nombre de versements effectués. */
  contributions: number;
  /** Prix d'achat moyen pondéré. */
  avgBuyPrice: number;
  /** Impôt estimé sur la plus-value (0 si moins-value ou taxPct=0). */
  tax: number;
  /** Valeur finale nette d'impôt (`finalValue - tax`). */
  netValue: number;
  /** Plus/moins-value nette (`netValue - invested`). */
  netProfit: number;
  /** Rendement net (`netProfit / invested`). */
  netRoi: number;
  /** Dates ISO de chaque versement (pour les comparatifs benchmark). */
  contributionDates: string[];
  series: ResultPoint[];
}

/** Série de prix réelle d'un actif de référence (ETF, or…). */
export interface BenchmarkSeries {
  key: string;
  label: string;
  prices: PricePoint[];
}

/** Résultat d'un comparatif sur le même échéancier de versements. */
export interface Benchmark {
  key: string;
  label: string;
  finalValue: number;
  roi: number;
}

/** Indicateurs de risque calculés sur la trajectoire de valeur. */
export interface RiskMetrics {
  /** Plus forte baisse depuis un sommet (ratio négatif, ex. -0.62). */
  maxDrawdown: number;
  /** Volatilité annualisée des rendements journaliers (ratio). */
  volatility: number;
}

/** Métadonnées d'une crypto proposée dans le simulateur. */
export interface Coin {
  /** Identifiant CoinGecko (ex. `bitcoin`). */
  id: string;
  /** Ticker (ex. `BTC`). */
  symbol: string;
  /** Nom affiché (ex. `Bitcoin`). */
  name: string;
}
