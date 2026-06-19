"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSimulation } from "../hooks/use-simulation";
import { COINS, getCoin } from "../lib/coins";
import {
  formatCoins,
  formatEUR,
  formatEURPrecise,
  formatPercent,
} from "../lib/format";
import type { Frequency } from "../types";
import { EvolutionChart } from "./evolution-chart";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "once", label: "Unique" },
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdo" },
  { value: "monthly", label: "Mensuel" },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function CryptoSimulator() {
  const [coinId, setCoinId] = useState("bitcoin");
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  // période par défaut : 365 derniers jours (page rendue dynamiquement, donc
  // SSR et client calculent la même date → pas de décalage d'hydratation)
  const [from, setFrom] = useState(() => isoDaysAgo(365));
  const [to, setTo] = useState(() => isoDaysAgo(0));

  const { result, loading, error, hasData } = useSimulation({
    coinId,
    amount,
    frequency,
    from,
    to,
  });

  const coin = getCoin(coinId);
  const positive = result.profit >= 0;
  const showResults = hasData && !error;

  return (
    <div className="grid gap-5 @container lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* ───────── Panneau de saisie ───────── */}
      <Card className="h-fit gap-5 p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="crypto">Cryptomonnaie</Label>
          <Select
            value={coinId}
            onValueChange={(v) => v && setCoinId(v)}
          >
            <SelectTrigger id="crypto" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COINS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  <span className="text-muted-foreground">· {c.symbol}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fréquence d&apos;investissement</Label>
          <Tabs
            value={frequency}
            onValueChange={(v) => setFrequency(v as Frequency)}
          >
            <TabsList className="grid w-full grid-cols-4">
              {FREQUENCIES.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            {frequency === "once" ? "Montant investi" : "Montant par versement"}
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min={1}
              step={10}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="pr-9"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
              €
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="from">Début</Label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">Fin</Label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from || undefined}
              max={isoDaysAgo(0)}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Historique limité aux 365 derniers jours sur la démo (palier gratuit
          CoinGecko).
        </p>
      </Card>

      {/* ───────── Panneau de résultats ───────── */}
      <Card className="gap-0 overflow-hidden p-0">
        {error ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="font-medium text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">
              Réessaie dans un instant ou change de crypto.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-border p-5 sm:p-6">
              <p className="text-sm text-muted-foreground">
                Valeur estimée de ton portefeuille {coin?.name}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {loading || !showResults ? (
                  <Skeleton className="h-10 w-44" />
                ) : (
                  <span className="text-[clamp(1.9rem,6cqw,2.75rem)] font-bold leading-none tracking-tight">
                    {formatEUR(result.finalValue)}
                  </span>
                )}
                {showResults && !loading && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold",
                      positive
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {positive ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                    {formatPercent(result.roi)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border @lg:grid-cols-4">
              <Stat
                label="Total investi"
                value={formatEUR(result.invested)}
                loading={loading || !showResults}
              />
              <Stat
                label={positive ? "Plus-value" : "Moins-value"}
                value={formatEUR(result.profit)}
                accent={positive ? "success" : "destructive"}
                loading={loading || !showResults}
              />
              <Stat
                label="Quantité"
                value={
                  coin ? formatCoins(result.coins, coin.symbol) : "—"
                }
                loading={loading || !showResults}
              />
              <Stat
                label="Prix d'achat moyen"
                value={formatEURPrecise(result.avgBuyPrice)}
                loading={loading || !showResults}
              />
            </div>

            <div className="h-[260px] p-3 pr-4 sm:h-[300px]">
              {loading || !showResults ? (
                <Skeleton className="size-full" />
              ) : (
                <EvolutionChart series={result.series} />
              )}
            </div>

            <p className="border-t border-border p-4 text-center text-xs leading-relaxed text-muted-foreground">
              Simulation rétrospective sur prix historiques réels. Les
              performances passées ne préjugent pas des performances futures.
              Investir en crypto-actifs comporte un risque de perte en capital
              partielle ou totale.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  loading,
}: {
  label: string;
  value: string;
  accent?: "success" | "destructive";
  loading?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-5 w-20" />
      ) : (
        <p
          className={cn(
            "mt-1 font-semibold",
            accent === "success" && "text-success",
            accent === "destructive" && "text-destructive",
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}
