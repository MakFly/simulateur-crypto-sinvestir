"use client";

import { useEffect, useMemo, useState } from "react";
import { simulate } from "../lib/simulate";
import type { Frequency, PricePoint, SimulationResult } from "../types";

interface UseSimulationParams {
  coinId: string;
  amount: number;
  frequency: Frequency;
  /** Dates ISO `yyyy-mm-dd` ; tant qu'elles sont vides, aucun fetch n'est lancé. */
  from: string;
  to: string;
}

interface UseSimulationReturn {
  result: SimulationResult;
  loading: boolean;
  error: string | null;
  hasData: boolean;
}

/**
 * Récupère la série de prix (`/api/prices`) pour la crypto et la période, puis
 * recalcule la simulation. Le fetch ne dépend que de `coinId/from/to` ; changer
 * le montant ou la fréquence recalcule en mémoire, sans appel réseau.
 */
export function useSimulation({
  coinId,
  amount,
  frequency,
  from,
  to,
}: UseSimulationParams): UseSimulationReturn {
  const [prices, setPrices] = useState<PricePoint[]>([]);
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

  const result = useMemo(
    () => simulate({ amount, frequency, prices }),
    [amount, frequency, prices],
  );

  return { result, loading, error, hasData: prices.length > 0 };
}
