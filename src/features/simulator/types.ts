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
}

/** Point de la courbe d'évolution renvoyée au graphe. */
export interface ResultPoint {
  date: string;
  /** Cumul investi à cette date. */
  invested: number;
  /** Valeur du portefeuille à cette date. */
  value: number;
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
  series: ResultPoint[];
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
