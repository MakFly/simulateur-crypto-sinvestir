"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCoins, formatEUR } from "../lib/format";
import type { ResultPoint } from "../types";

interface EvolutionChartProps {
  series: ResultPoint[];
  symbol: string;
}

const monthFmt = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "2-digit",
});

function formatAxisDate(iso: string): string {
  return monthFmt.format(new Date(iso));
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function ChartTooltip({
  active,
  payload,
  label,
  symbol,
}: {
  active?: boolean;
  payload?: { payload: ResultPoint }[];
  label?: string;
  symbol: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="mb-1 font-medium text-muted-foreground">
        {new Date(label ?? "").toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Valeur</span>
        <span className="font-semibold text-primary">
          {formatEUR(point.value)}
        </span>
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Investi</span>
        <span className="font-medium">{formatEUR(point.invested)}</span>
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Quantité</span>
        <span className="font-medium text-chart-2">
          {formatCoins(point.coins, symbol)}
        </span>
      </p>
    </div>
  );
}

export function EvolutionChart({ series, symbol }: EvolutionChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={series}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatAxisDate}
          minTickGap={48}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickFormatter={formatCompact}
          width={48}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip symbol={symbol} />} />
        <Area
          type="monotone"
          dataKey="invested"
          stroke="var(--color-muted-foreground)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#fillValue)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
