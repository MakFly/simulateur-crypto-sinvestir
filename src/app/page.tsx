import { CryptoSimulator } from "@/features/simulator/components/crypto-simulator";
import { SiteHeader } from "@/components/site-header";
import { isSupportedCoin } from "@/features/simulator/lib/coins";
import type { SimulatorFormValues } from "@/features/simulator/lib/schema";
import type { Frequency } from "@/features/simulator/types";

// rendu à la requête : la période par défaut (« 365 derniers jours ») est
// calculée au runtime, jamais figée au build.
export const dynamic = "force-dynamic";

const FREQUENCIES: Frequency[] = ["once", "daily", "weekly", "monthly"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reconstruit l'état initial à partir des query params (URL partageable). */
function parseInitial(
  sp: Record<string, string | string[] | undefined>,
): Partial<SimulatorFormValues> {
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const init: Partial<SimulatorFormValues> = {};

  const coin = one(sp.coin);
  if (coin && isSupportedCoin(coin)) init.coinId = coin;

  const freq = one(sp.freq);
  if (freq && (FREQUENCIES as string[]).includes(freq))
    init.frequency = freq as Frequency;

  const amount = one(sp.amount);
  if (amount && /^\d+$/.test(amount)) init.amount = amount;

  const from = one(sp.from);
  if (from && ISO_DATE.test(from)) init.from = from;

  const to = one(sp.to);
  if (to && ISO_DATE.test(to)) init.to = to;

  return init;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialValues = parseInitial(await searchParams);

  return (
    <>
      <SiteHeader />
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

        <CryptoSimulator initialValues={initialValues} syncUrl />
      </main>
    </>
  );
}
