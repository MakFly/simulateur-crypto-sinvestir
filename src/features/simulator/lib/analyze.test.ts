import { describe, expect, test } from "bun:test";
import { analyze, benchmarkValue, computeRisk } from "./analyze";
import type { PricePoint } from "../types";

const p = (date: string, price: number): PricePoint => ({ date, price });

describe("analyze", () => {
  test("lump-sum investit le total au premier prix", () => {
    const a = analyze({
      amount: 100,
      frequency: "daily",
      prices: [p("2024-01-01", 10), p("2024-01-02", 20)],
    });
    expect(a.main.invested).toBe(200); // 2 versements quotidiens
    expect(a.lumpSum?.invested).toBe(200); // même total, en une fois
    expect(a.lumpSum?.coins).toBeCloseTo(20); // 200 / 10
    expect(a.lumpSum?.finalValue).toBeCloseTo(400); // 20 * 20
  });

  test("pas de lump-sum quand la fréquence est déjà 'once'", () => {
    const a = analyze({
      amount: 100,
      frequency: "once",
      prices: [p("2024-01-01", 10)],
    });
    expect(a.lumpSum).toBeNull();
  });

  test("deux benchmarks calculés sur l'échéancier", () => {
    const a = analyze({
      amount: 100,
      frequency: "monthly",
      prices: [p("2023-01-01", 10), p("2024-01-01", 10)],
    });
    expect(a.benchmarks).toHaveLength(2);
    // sur ~1 an à taux positif, la valeur dépasse le capital investi
    expect(a.benchmarks[0].finalValue).toBeGreaterThan(a.main.invested);
  });
});

describe("benchmarkValue", () => {
  test("intérêts composés : 100 € à 10 % sur 1 an ≈ 110 €", () => {
    expect(benchmarkValue(["2023-01-01"], 100, "2024-01-01", 0.1)).toBeCloseTo(
      110,
      0,
    );
  });
});

describe("computeRisk", () => {
  test("max drawdown sur une chute de 100 à 50 = -50 %", () => {
    const r = computeRisk([
      p("2024-01-01", 100),
      p("2024-01-02", 50),
      p("2024-01-03", 80),
    ]);
    expect(r.maxDrawdown).toBeCloseTo(-0.5);
    expect(r.volatility).toBeGreaterThan(0);
  });
});
