export const TLDR = `# TL;DR — Simulateur Crypto façon S'investir

Transposition du [simulateur crypto sinvestir.fr](https://sinvestir.fr/simulateur-crypto-monnaie/)
aux standards de la suite [simulateurs.sinvestir.fr](https://simulateurs.sinvestir.fr/),
livrée comme test technique.

## En une phrase

On rejoue la performance d'un investissement crypto (**achat unique** ou **DCA**)
sur les **prix historiques réels**, avec une lecture **pédagogique** : comparaison
à d'autres placements, risque, frais et fiscalité.

## Stack & pourquoi

- **Next.js 16 (App Router) + React 19 + TypeScript strict** — la stack interne annoncée par S'investir, donc intégrable directement.
- **Tailwind v4 + shadcn/ui** — tokens de design extraits de leur CSS de prod (Lexend, dark-first, radius 8px) ; palette retravaillée façon plateforme de trading.
- **react-hook-form + zod** — formulaire validé (montant *number-only*, période bornée).
- **Recharts** — courbe d'évolution interactive (survol, zoom au drag).
- **\`fetch\` natif**, zéro axios, logique de calcul **pure et testée** (16 tests).

> Leur suite réelle est en Nuxt : la logique vit dans une fonction pure + un hook,
> sans couplage au layout — donc transposable, et embarquable via iframe.

## Fonctionnalités

- Achat unique **ou** DCA (quotidien / hebdo / mensuel) sur données réelles.
- KPI : valeur finale, plus/moins-value, ROI, quantité, prix d'achat moyen.
- Graphe : survol temps réel (valeur / investi / quantité), **zoom au drag** sur une plage.
- **Net de frais & fiscalité** (frais 0,5 % + PFU 30 %) en un clic.
- **Comparaison d'opportunité** : crypto vs achat unique vs Livret A vs ETF World.
- **Indicateurs de risque** : volatilité annualisée, plus forte baisse (drawdown).
- **URL partageable** (l'état est dans l'adresse) et **aperçu embarquable** (\`/embed\`).

## Données — 100 % réelles

- **Crypto** : **Binance** (klines EUR, paginé, historique depuis 2020), **CoinGecko** en repli.
- **Benchmarks** : **Yahoo Finance** pour l'ETF **MSCI World** (\`EUNL.DE\`) et l'**Or** (\`4GLD.DE\`), cotés en EUR — vrai backtest sur les mêmes versements.
- **Livret A** : **barème officiel** (taux réglementé Banque de France, historisé).

Aucun taux inventé : les comparatifs sont des backtests sur séries réelles.

## Limites assumées

- ~12 cryptos majeures (la couche données accepte tout identifiant supporté).
- Yahoo Finance est une API publique non officielle : sur forte sollicitation
  d'une même IP elle peut temporairement répondre 429 — les benchmarks marché
  se dégradent alors proprement (le Livret A, calculé hors réseau, reste affiché).
- Performances passées ≠ futures — risque de perte en capital.

## Lancer

\`\`\`bash
bun install
bun run dev      # http://localhost:3000
bun test         # logique de calcul
\`\`\`
`;
