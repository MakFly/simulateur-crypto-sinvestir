"use client";

import { useEffect, useMemo, useState } from "react";
import { analyze, type Analysis } from "../lib/analyze";
import type { Frequency, PricePoint } from "../types";

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
 * Récupère la série de prix (`/api/prices`) pour la crypto et la période, puis
 * recalcule l'analyse (simulation + lump-sum + benchmarks + risque). Le fetch ne
 * dépend que de `coinId/from/to` ; changer montant/fréquence/frais recalcule en
 * mémoire, sans appel réseau.
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
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ coin: coinId, from, to });
        const res = await fetch(`/api/prices?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur de chargement.");
        setPrices(json.prices as PricePoint[]);
        setSource(json.source as string);
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
    () => analyze({ amount, frequency, prices, feePct, taxPct }),
    [amount, frequency, prices, feePct, taxPct],
  );

  return { analysis, loading, error, hasData: prices.length > 0, source };
}
