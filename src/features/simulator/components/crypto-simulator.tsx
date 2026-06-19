"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { type Matcher } from "react-day-picker";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarIcon,
  Info,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSimulation } from "../hooks/use-simulation";
import { COINS, getCoin } from "../lib/coins";
import {
  formatCoins,
  formatEUR,
  formatEURPrecise,
  formatPercent,
  formatPercentPlain,
} from "../lib/format";
import { simulatorFormSchema, type SimulatorFormValues } from "../lib/schema";
import type { Frequency } from "../types";
import { ChartHelpDialog } from "./chart-help-dialog";
import { EvolutionChart } from "./evolution-chart";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "once", label: "Unique" },
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdo" },
  { value: "monthly", label: "Mensuel" },
];

const FEE_PCT = 0.5; // frais d'achat illustratifs
const TAX_PCT = 30; // PFU (flat tax) FR sur la plus-value
const HISTORY_FLOOR = new Date("2020-01-01");

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return format(d, "yyyy-MM-dd");
}

const dateFromIso = (iso: string): Date => new Date(`${iso}T00:00:00`);
const shortDate = (iso: string): string =>
  format(dateFromIso(iso), "dd/MM/yyyy");

interface CryptoSimulatorProps {
  /** Valeurs initiales (ex. issues des query params pour le partage). */
  initialValues?: Partial<SimulatorFormValues>;
  /** Si vrai, l'état est reflété dans l'URL (page principale, pas l'embed). */
  syncUrl?: boolean;
}

export function CryptoSimulator({
  initialValues,
  syncUrl = false,
}: CryptoSimulatorProps) {
  const [netMode, setNetMode] = useState(false);

  const {
    control,
    formState: { errors },
  } = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorFormSchema),
    mode: "onChange",
    // dates calculées au runtime (page dynamique) -> pas de mismatch d'hydratation
    defaultValues: {
      coinId: initialValues?.coinId ?? "bitcoin",
      frequency: initialValues?.frequency ?? "monthly",
      amount: initialValues?.amount ?? "100",
      from: initialValues?.from ?? isoDaysAgo(365),
      to: initialValues?.to ?? isoDaysAgo(0),
    },
  });

  // useWatch type les champs comme optionnels, mais tous ont une valeur par
  // défaut dans useForm -> le cast est sûr.
  const values = useWatch({ control }) as SimulatorFormValues;

  // état reflété dans l'URL (partage) — replaceState : pas de navigation serveur
  useEffect(() => {
    if (!syncUrl) return;
    const q = new URLSearchParams({
      coin: values.coinId,
      freq: values.frequency,
      amount: values.amount,
      from: values.from,
      to: values.to,
    });
    window.history.replaceState(null, "", `?${q.toString()}`);
  }, [
    syncUrl,
    values.coinId,
    values.frequency,
    values.amount,
    values.from,
    values.to,
  ]);

  const { analysis, loading, error, hasData, source } = useSimulation({
    coinId: values.coinId,
    amount: Number(values.amount) || 0,
    frequency: values.frequency,
    from: values.from,
    to: values.to,
    feePct: netMode ? FEE_PCT : 0,
    taxPct: netMode ? TAX_PCT : 0,
  });

  const { main, lumpSum, benchmarks, risk } = analysis;
  const coin = getCoin(values.coinId);
  const showResults = hasData && !error;

  // valeurs affichées : brutes ou nettes de frais & fiscalité
  const value = netMode ? main.netValue : main.finalValue;
  const profit = netMode ? main.netProfit : main.profit;
  const roi = netMode ? main.netRoi : main.roi;
  const positive = profit >= 0;
  const lumpValue = lumpSum
    ? netMode
      ? lumpSum.netValue
      : lumpSum.finalValue
    : 0;
  const lumpRoi = lumpSum ? (netMode ? lumpSum.netRoi : lumpSum.roi) : 0;

  // bornage croisé : 2020 ≤ début ≤ fin ≤ aujourd'hui
  const today = new Date();
  const fromDisabled: Matcher[] = [
    { before: HISTORY_FLOOR },
    { after: values.to ? dateFromIso(values.to) : today },
  ];
  const toDisabled: Matcher[] = [
    { before: values.from ? dateFromIso(values.from) : HISTORY_FLOOR },
    { after: today },
  ];

  return (
    <div className="grid gap-5 @container lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* ───────── Panneau de saisie ───────── */}
      <Card className="h-fit gap-5 p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="crypto">Cryptomonnaie</Label>
          <Controller
            control={control}
            name="coinId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
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
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Fréquence d&apos;investissement</Label>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <Tabs
                value={field.value}
                onValueChange={(v) => v && field.onChange(v as Frequency)}
              >
                <TabsList className="grid w-full grid-cols-4">
                  {FREQUENCIES.map((f) => (
                    <TabsTrigger
                      key={f.value}
                      value={f.value}
                      className="text-xs"
                    >
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            {values.frequency === "once"
              ? "Montant investi"
              : "Montant par versement"}
          </Label>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={field.value}
                  // contrôle "number only" : on ne garde que les chiffres
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, ""))
                  }
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.amount}
                  className="pr-9"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  €
                </span>
              </div>
            )}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Période</Label>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="from"
              render={({ field }) => (
                <DatePicker
                  id="from"
                  placeholder="Début"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={fromDisabled}
                />
              )}
            />
            <Controller
              control={control}
              name="to"
              render={({ field }) => (
                <DatePicker
                  id="to"
                  placeholder="Fin"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={toDisabled}
                />
              )}
            />
          </div>
          {errors.to && (
            <p className="text-xs text-destructive">{errors.to.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
          <Label htmlFor="net" className="cursor-pointer leading-tight">
            Net de frais &amp; fiscalité
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Frais {FEE_PCT} % · PFU {TAX_PCT} % sur la plus-value
            </span>
          </Label>
          <Switch id="net" checked={netMode} onCheckedChange={setNetMode} />
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Historique depuis 2020 · données {source === "coingecko"
            ? "CoinGecko"
            : "Binance"}{" "}
          (prix de clôture journaliers).
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
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Valeur estimée de ton portefeuille {coin?.name}
                  {netMode && " (net)"}
                </p>
                <ChartHelpDialog />
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {loading || !showResults ? (
                  <Skeleton className="h-10 w-44" />
                ) : (
                  <span className="text-[clamp(1.9rem,6cqw,2.75rem)] font-bold leading-none tracking-tight">
                    {formatEUR(value)}
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
                    {formatPercent(roi)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border @lg:grid-cols-4">
              <Stat
                label="Total investi"
                value={formatEUR(main.invested)}
                loading={loading || !showResults}
              />
              <Stat
                label={positive ? "Plus-value" : "Moins-value"}
                value={formatEUR(profit)}
                accent={positive ? "success" : "destructive"}
                loading={loading || !showResults}
              />
              <Stat
                label="Quantité"
                value={coin ? formatCoins(main.coins, coin.symbol) : "—"}
                loading={loading || !showResults}
              />
              <Stat
                label="Prix d'achat moyen"
                value={formatEURPrecise(main.avgBuyPrice)}
                loading={loading || !showResults}
              />
            </div>

            <div className="h-[260px] p-3 pr-4 sm:h-[300px]">
              {loading || !showResults ? (
                <Skeleton className="size-full" />
              ) : (
                <EvolutionChart
                  key={`${values.coinId}-${values.from}-${values.to}`}
                  series={main.series}
                  symbol={coin?.symbol ?? ""}
                />
              )}
            </div>

            {showResults && !loading && (
              <div className="space-y-5 border-t border-border p-5 sm:p-6">
                {/* Risque de l'actif */}
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Risque de l&apos;actif sur la période
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">
                        Volatilité annualisée
                      </p>
                      <p className="mt-0.5 font-semibold">
                        {formatPercentPlain(risk.volatility)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">
                        Plus forte baisse
                      </p>
                      <p className="mt-0.5 font-semibold text-destructive">
                        {formatPercent(risk.maxDrawdown)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comparaison d'opportunité */}
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Et avec les mêmes versements ailleurs&nbsp;?
                  </p>
                  <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    <CompareRow
                      label={`${coin?.name ?? "Crypto"} — ta simulation`}
                      value={value}
                      roi={roi}
                      highlight
                    />
                    {lumpSum && (
                      <CompareRow
                        label="Si tout investi au départ"
                        value={lumpValue}
                        roi={lumpRoi}
                      />
                    )}
                    {benchmarks.map((b) => (
                      <CompareRow
                        key={b.key}
                        label={`${b.label} (${formatPercentPlain(b.rate)}/an)`}
                        value={b.finalValue}
                        roi={b.roi}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <p className="border-t border-border p-4 text-center text-xs leading-relaxed text-muted-foreground">
              Simulation rétrospective sur prix historiques réels ; benchmarks à
              taux fixe illustratifs. Les performances passées ne préjugent pas
              des performances futures. Investir en crypto-actifs comporte un
              risque de perte en capital partielle ou totale.
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

function CompareRow({
  label,
  value,
  roi,
  highlight,
}: {
  label: string;
  value: number;
  roi: number;
  highlight?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5 text-sm",
        highlight && "bg-primary/10",
      )}
    >
      <span className={cn("text-muted-foreground", highlight && "font-medium text-foreground")}>
        {label}
      </span>
      <span className="flex items-baseline gap-2 text-right">
        <span className="font-semibold">{formatEUR(value)}</span>
        <span
          className={cn(
            "text-xs font-medium",
            roi >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {formatPercent(roi)}
        </span>
      </span>
    </li>
  );
}

/** Sélecteur de date unique (Popover + Calendar), avec fermeture auto. */
function DatePicker({
  id,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (iso: string) => void;
  disabled?: Matcher[];
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? dateFromIso(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start px-3 font-normal",
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        {value ? (
          <span className="truncate">{shortDate(value)}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          disabled={disabled}
          locale={fr}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
