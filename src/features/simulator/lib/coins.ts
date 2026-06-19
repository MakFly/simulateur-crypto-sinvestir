import type { Coin } from "../types";

/**
 * Set curaté des cryptos majeures proposées dans la démo.
 *
 * Le simulateur de référence annonce « 7 000+ actifs » ; pour la démo on
 * restreint aux principales (identifiants CoinGecko) — la couche données est
 * conçue pour s'étendre à n'importe quel `id` CoinGecko sans changer la logique.
 */
export const COINS: Coin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "tron", symbol: "TRX", name: "TRON" },
];

const COIN_IDS = new Set(COINS.map((c) => c.id));

export function isSupportedCoin(id: string): boolean {
  return COIN_IDS.has(id);
}

export function getCoin(id: string): Coin | undefined {
  return COINS.find((c) => c.id === id);
}
