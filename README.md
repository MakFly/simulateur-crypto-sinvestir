# Simulateur Crypto — façon S'investir

Transposition du [simulateur crypto sinvestir.fr](https://sinvestir.fr/simulateur-crypto-monnaie/)
aux standards visuels de la suite [simulateurs.sinvestir.fr](https://simulateurs.sinvestir.fr/).

On reprend la **logique fonctionnelle** (achat unique ou investissement programmé
sur prix historiques réels) et on l'habille en **dark-first** (typo Lexend, radius
8px repris de la suite S'investir), avec une **palette « trading » inspirée
TradingView** (slate profond, bleu accent, vert/rouge pour les +/- value) adaptée
au contexte crypto.

---

## Lancer le projet

```bash
bun install
bun run dev          # http://localhost:3000
```

| Commande          | Effet                                   |
| ----------------- | --------------------------------------- |
| `bun run dev`     | Serveur de dev (Turbopack)              |
| `bun run build`   | Build de production + typecheck         |
| `bun run start`   | Serveur de production                   |
| `bun run lint`    | ESLint                                  |
| `bun test`        | Tests unitaires de la logique de calcul |

Aucune variable d'environnement n'est requise (l'API CoinGecko publique suffit).
Une clé optionnelle se configure via `.env` — voir `.env.example`.

---

## Architecture

```
 Navigateur ── <CryptoSimulator /> (composant autonome, embeddable)
      │              │
      │   useSimulation() ── analyze() : one-shot + DCA + comparatifs + risque (testé)
      │              │
      ├── fetch ──▶ /api/prices     ──▶ Binance klines EUR (histo) → CoinGecko (repli)
      └── fetch ──▶ /api/benchmarks ──▶ Yahoo Finance (MSCI World, Or, EUR)
                                        + Livret A (barème officiel, hors réseau)
```

- **`lib/simulate.ts`** — logique pure (one-shot/DCA, frais, fiscalité), testée.
- **`lib/analyze.ts`** — lump-sum, backtests benchmark réels, risque (drawdown/volatilité).
- **`lib/prices.ts`** — multi-fournisseur Binance → CoinGecko (clé masquée, cache).
- **`lib/benchmarks.ts`** + **`lib/livret-a.ts`** — séries Yahoo Finance + barème Livret A.
- **`hooks/use-simulation.ts`** — orchestration : fetch prix + benchmarks, recalcul mémoïsé.
- **`components/`** — `CryptoSimulator`, `EvolutionChart` (Recharts, zoom au drag).
- **`app/embed/`** — version sans chrome (iframe auto-resize) ; **`app/tldr/`** — résumé markdown.

---

## Partis pris techniques

- **Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + TypeScript strict**, déployé
  sur **Vercel** : c'est la stack interne annoncée par S'investir, donc le rendu
  s'intègre directement à votre infra.
- **Pourquoi pas Nuxt ?** Votre suite `simulateurs.sinvestir.fr` tourne en Nuxt 3 +
  Nuxt UI. J'ai choisi Next.js pour coller au brief. La structure visuelle reprend
  vos fondamentaux (dark-first, **Lexend**, radius 8px), mais la palette a été
  retravaillée façon plateforme de trading (TradingView) pour le contexte crypto.
  Tous les tokens sont centralisés dans `globals.css` : revenir au bleu/jaune
  S'investir = changer ~15 variables CSS. Le composant est volontairement
  *framework-agnostic* : toute la logique vit dans une fonction pure + un hook, sans
  couplage au layout — transposable en composant Nuxt ou consommable via iframe.
- **Logique isolée et testée** : `simulate()` ne connaît ni React ni le réseau, ce
  qui la rend triviale à porter, à tester et à réutiliser.
- **CoinGecko en proxy serveur** : la clé d'API n'est jamais exposée au client et
  les réponses sont cachées 1 h pour limiter le rate-limit.
- **`fetch` natif** (pas d'axios), **peu de dépendances** (recharts + shadcn).
- **Responsive mobile-first** : layout fluide, `min-h-dvh`, container queries,
  typographie en `clamp()`, cibles tactiles ≥ 44px, dark mode natif.

---

## Intégration & embedding

Le composant est conçu pour deux usages :

1. **Remplacer le simulateur actuel** dans la suite — il suffit de monter
   `<CryptoSimulator />` ; il n'a aucune dépendance au reste de l'app.
2. **Aperçu embarqué depuis `sinvestir.fr`** — via la route dédiée :

   ```html
   <iframe src="https://<demo>.vercel.app/embed" style="width:100%;border:0;height:680px"></iframe>
   ```

> Pour la démo, les intégrations réelles ne sont pas branchées : l'objectif est de
> montrer que le composant est réutilisable et embarquable proprement.

---

## Données — 100 % réelles

- **Crypto** : Binance (klines EUR, historique depuis 2020), CoinGecko en repli.
- **Benchmarks** : Yahoo Finance pour l'ETF **MSCI World** (`EUNL.DE`) et l'**Or**
  (`4GLD.DE`) en EUR — vrai backtest ; **Livret A** au barème officiel réglementé.

## Limites assumées

- **Set de ~12 cryptos majeures** (vs « 7 000+ ») ; la couche données accepte
  n'importe quel identifiant supporté.
- **Yahoo Finance** est une API publique non officielle : sous forte sollicitation
  d'une même IP elle peut répondre 429. Les benchmarks marché se dégradent alors
  proprement (le Livret A, calculé hors réseau, reste affiché). Sur Vercel (IP
  dédiée + cache 6 h) le quota n'est pas un souci.
- Benchmarks comme **comparaison d'opportunité**, pas conseil en investissement.

---

## Suggestions d'amélioration

Pistes restantes : projection prospective (scénarios bas/médian/haut), capture de
lead branchée HubSpot/Tally, analytics sur les embeds depuis le blog, cache des
séries (KV/Redis) pour s'affranchir des quotas des API publiques.
