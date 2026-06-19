import { describe, expect, test } from "bun:test";
import { simulate } from "./simulate";
import type { PricePoint } from "../types";

const p = (date: string, price: number): PricePoint => ({ date, price });

describe("simulate", () => {
  test("achat unique (once) : un seul versement au premier prix", () => {
    const r = simulate({
      amount: 100,
      frequency: "once",
      prices: [p("2024-01-01", 10), p("2024-01-02", 15), p("2024-01-03", 20)],
    });
    expect(r.contributions).toBe(1);
    expect(r.invested).toBe(100);
    expect(r.coins).toBeCloseTo(10); // 100 / 10
    expect(r.finalValue).toBeCloseTo(200); // 10 coins * 20
    expect(r.profit).toBeCloseTo(100);
    expect(r.roi).toBeCloseTo(1); // +100 %
    expect(r.avgBuyPrice).toBeCloseTo(10);
    expect(r.series).toHaveLength(3);
  });

  test("DCA quotidien : un versement par jour, prix plat => profit nul", () => {
    const r = simulate({
      amount: 100,
      frequency: "daily",
      prices: [p("2024-01-01", 10), p("2024-01-02", 10), p("2024-01-03", 10)],
    });
    expect(r.contributions).toBe(3);
    expect(r.invested).toBe(300);
    expect(r.coins).toBeCloseTo(30);
    expect(r.finalValue).toBeCloseTo(300);
    expect(r.profit).toBeCloseTo(0);
    expect(r.roi).toBeCloseTo(0);
  });

  test("DCA hebdomadaire : un versement tous les 7 jours", () => {
    const prices = Array.from({ length: 15 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return p(`2024-01-${day}`, 10);
    });
    const r = simulate({ amount: 50, frequency: "weekly", prices });
    // jours 1, 8, 15 => 3 versements
    expect(r.contributions).toBe(3);
    expect(r.invested).toBe(150);
  });

  test("DCA mensuel : un versement par mois calendaire", () => {
    const r = simulate({
      amount: 200,
      frequency: "monthly",
      prices: [
        p("2024-01-05", 10),
        p("2024-01-20", 12),
        p("2024-02-03", 15),
        p("2024-03-01", 20),
      ],
    });
    // janvier, février, mars => 3 versements
    expect(r.contributions).toBe(3);
    expect(r.invested).toBe(600);
  });

  test("le prix d'achat moyen lisse les points d'entrée (DCA)", () => {
    const r = simulate({
      amount: 100,
      frequency: "daily",
      prices: [p("2024-01-01", 10), p("2024-01-02", 30)],
    });
    // 10 + 3.333 coins = 13.333 ; 200 / 13.333 = 15
    expect(r.coins).toBeCloseTo(13.3333, 3);
    expect(r.avgBuyPrice).toBeCloseTo(15);
  });

  test("série vide => résultat nul", () => {
    const r = simulate({ amount: 100, frequency: "once", prices: [] });
    expect(r).toMatchObject({ invested: 0, finalValue: 0, contributions: 0 });
  });

  test("montant nul ou négatif => résultat nul", () => {
    const r = simulate({
      amount: 0,
      frequency: "daily",
      prices: [p("2024-01-01", 10)],
    });
    expect(r.invested).toBe(0);
    expect(r.coins).toBe(0);
  });

  test("ignore les prix invalides (<= 0) et achète au premier prix valide", () => {
    const r = simulate({
      amount: 100,
      frequency: "once",
      prices: [p("2024-01-01", 0), p("2024-01-02", 50)],
    });
    // 1er point invalide (prix 0) -> achat reporté au 1er prix valide
    expect(r.contributions).toBe(1);
    expect(r.invested).toBe(100);
    expect(r.coins).toBeCloseTo(2);
  });
});
