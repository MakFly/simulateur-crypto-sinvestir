import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulateur Crypto | S'investir",
  description:
    "Simulez la performance d'un investissement crypto (achat unique ou DCA) sur données historiques réelles.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#131722",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${lexend.variable} dark h-full`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
