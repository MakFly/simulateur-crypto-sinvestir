import { z } from "zod";
import { isSupportedCoin } from "./coins";

/** Schéma du formulaire (montant saisi en texte, validé en number-only côté UI). */
export const simulatorFormSchema = z
  .object({
    coinId: z.string().refine(isSupportedCoin, "Cryptomonnaie non supportée."),
    frequency: z.enum(["once", "daily", "weekly", "monthly"]),
    amount: z
      .string()
      .min(1, "Indique un montant.")
      .refine((v) => Number(v) >= 1, "Montant minimum : 1 €.")
      .refine((v) => Number(v) <= 1_000_000, "Montant maximum : 1 000 000 €."),
    from: z.string().min(1, "Date de début requise."),
    to: z.string().min(1, "Date de fin requise."),
  })
  .refine((d) => d.from <= d.to, {
    message: "La date de début doit précéder la date de fin.",
    path: ["to"],
  });

export type SimulatorFormValues = z.infer<typeof simulatorFormSchema>;

/** Schéma des query params de `/api/prices`. */
export const priceQuerySchema = z.object({
  coin: z.string().refine(isSupportedCoin, "Crypto non supportée ou manquante."),
  from: z.string().optional(),
  to: z.string().optional(),
});
