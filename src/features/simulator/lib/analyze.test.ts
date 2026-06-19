import { describe, expect, test } from "bun:test";
import { analyze, computeRisk } from "./analyze";
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

  test("benchmark : backtest réel sur la série fournie + Livret A présent", () => {
    const a = analyze(
      {
        amount: 100,
        frequency: "monthly",
        prices: [p("2024-01-01", 10), p("2024-02-01", 10)],
      },
      [
        {
          key: "msci",
          label: "ETF MSCI World",
          prices: [p("2024-01-01", 50), p("2024-02-01", 100)],
        },
      ],
    );
    // versements aux 2 dates ; parts = 100/50 + 100/100 = 3 ; valeur = 3 * 100
    const msci = a.benchmarks.find((b) => b.key === "msci");
    expect(msci?.finalValue).toBeCloseTo(300);
    expect(msci?.roi).toBeCloseTo(0.5); // (300 - 200) / 200
    expect(a.benchmarks.some((b) => b.key === "livretA")).toBe(true);
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
