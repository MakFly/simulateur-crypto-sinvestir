import type { Metadata } from "next";
import { CryptoSimulator } from "@/features/simulator/components/crypto-simulator";
import { EmbedResizer } from "@/features/simulator/components/embed-resizer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simulateur Crypto — embed",
  robots: { index: false, follow: false },
};

/**
 * Version embarquable (iframe) sans en-tête ni marketing : uniquement le
 * composant, pour intégration dans un article sinvestir.fr ou la suite Nuxt.
 * `EmbedResizer` émet la hauteur au parent pour l'auto-redimensionnement.
 */
export default function EmbedPage() {
  return (
    <main className="w-full p-3 sm:p-4">
      <EmbedResizer />
      <CryptoSimulator />
    </main>
  );
}
