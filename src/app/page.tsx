import { CryptoSimulator } from "@/features/simulator/components/crypto-simulator";

// rendu à la requête : la période par défaut (« 365 derniers jours ») est
// calculée au runtime, jamais figée au build.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-8 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
          Simulateur · S&apos;investir
        </span>
        <h1 className="mt-4 text-[clamp(1.6rem,5vw,2.5rem)] font-bold leading-tight tracking-tight text-balance">
          Combien aurait rapporté un investissement crypto&nbsp;?
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          Choisis une cryptomonnaie, un montant et une fréquence : on rejoue la
          performance sur les prix historiques réels, en achat unique comme en
          investissement programmé (DCA).
        </p>
      </header>

      <CryptoSimulator />
    </main>
  );
}
