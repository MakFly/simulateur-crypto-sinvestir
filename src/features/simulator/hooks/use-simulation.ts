"use client";

import { useEffect, useMemo, useState } from "react";
import { analyze, type Analysis } from "../lib/analyze";
import type { BenchmarkSeries, Frequency, PricePoint } from "../types";

interface UseSimulationParams {
  coinId: string;
  amount: number;
  frequency: Frequency;
  /** Dates ISO `yyyy-mm-dd` ; tant qu'elles sont vides, aucun fetch n'est lancé. */
  from: string;
  to: string;
  feePct?: number;
  taxPct?: number;
}

interface UseSimulationReturn {
  analysis: Analysis;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  source: string | null;
}

/**
 * Récupère la série de prix crypto (`/api/prices`) et les actifs de référence
 * (`/api/benchmarks`) pour la période, puis recalcule l'analyse complète. Le
 * fetch ne dépend que de `coinId/from/to` ; changer montant/fréquence/frais
 * recalcule en mémoire, sans appel réseau.
 */
export function useSimulation({
  coinId,
  amount,
  frequency,
  from,
  to,
  feePct = 0,
  taxPct = 0,
}: UseSimulationParams): UseSimulationReturn {
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkSeries[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;

    const controller = new AbortController();
    const range = new URLSearchParams({ from, to });

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pricesRes, benchRes] = await Promise.all([
          fetch(`/api/prices?${new URLSearchParams({ coin: coinId, from, to })}`, {
            signal: controller.signal,
          }),
          fetch(`/api/benchmarks?${range}`, { signal: controller.signal }),
        ]);

        const pricesJson = await pricesRes.json();
        if (!pricesRes.ok)
          throw new Error(pricesJson.error ?? "Erreur de chargement.");
        setPrices(pricesJson.prices as PricePoint[]);
        setSource(pricesJson.source as string);

        // les benchmarks sont un bonus : un échec n'interrompt pas la simulation
        if (benchRes.ok) {
          const benchJson = await benchRes.json();
          setBenchmarks((benchJson.benchmarks ?? []) as BenchmarkSeries[]);
        } else {
          setBenchmarks([]);
        }
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [coinId, from, to]);

  const analysis = useMemo(
    () => analyze({ amount, frequency, prices, feePct, taxPct }, benchmarks),
    [amount, frequency, prices, feePct, taxPct, benchmarks],
  );

  return { analysis, loading, error, hasData: prices.length > 0, source };
}
