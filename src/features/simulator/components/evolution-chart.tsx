"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [zoom, setZoom] = useState<{ from: string; to: string } | null>(null);
  const [refLeft, setRefLeft] = useState<string | null>(null);
  const [refRight, setRefRight] = useState<string | null>(null);

  // données affichées = série complète, ou bornée à la plage zoomée
  const data = useMemo(() => {
    if (!zoom) return series;
    return series.filter((p) => p.date >= zoom.from && p.date <= zoom.to);
  }, [series, zoom]);

  function endSelection() {
    if (refLeft && refRight && refLeft !== refRight) {
      const [from, to] = [refLeft, refRight].sort();
      setZoom({ from, to });
    }
    setRefLeft(null);
    setRefRight(null);
  }

  const selecting =
    refLeft !== null && refRight !== null && refLeft !== refRight;

  return (
    <div className="relative size-full cursor-crosshair select-none outline-none [&_*]:outline-none [&_.recharts-surface]:outline-none">
      {zoom && (
        <Button
          variant="outline"
          size="xs"
          onClick={() => setZoom(null)}
          className="absolute top-0 right-2 z-10"
        >
          <ZoomOut className="size-3.5" />
          Réinitialiser
        </Button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onMouseDown={(e) => {
            const lbl = e?.activeLabel;
            if (lbl != null) {
              setRefLeft(String(lbl));
              setRefRight(String(lbl));
            }
          }}
          onMouseMove={(e) => {
            const lbl = e?.activeLabel;
            if (refLeft && lbl != null) setRefRight(String(lbl));
          }}
          onMouseUp={endSelection}
          onMouseLeave={() => {
            setRefLeft(null);
            setRefRight(null);
          }}
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
        {selecting && (
          <ReferenceArea
            x1={refLeft ?? undefined}
            x2={refRight ?? undefined}
            strokeOpacity={0}
            fill="var(--color-primary)"
            fillOpacity={0.12}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
