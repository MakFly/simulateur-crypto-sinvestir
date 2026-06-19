import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // l'aperçu embarqué n'est intégrable que depuis sinvestir.fr (et ses
        // sous-domaines) ; partout ailleurs le navigateur refuse l'iframe.
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://sinvestir.fr https://*.sinvestir.fr;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
