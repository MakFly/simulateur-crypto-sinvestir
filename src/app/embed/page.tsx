import type { Metadata } from "next";
import { CryptoSimulator } from "@/features/simulator/components/crypto-simulator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simulateur Crypto — embed",
  robots: { index: false, follow: false },
};

/**
 * Version embarquable (iframe) sans en-tête ni marketing : uniquement le
 * composant, pour intégration dans un article sinvestir.fr ou la suite Nuxt.
 */
export default function EmbedPage() {
  return (
    <main className="w-full p-3 sm:p-4">
      <CryptoSimulator />
    </main>
  );
}
