"use client";

import { useEffect } from "react";

/**
 * Émet la hauteur du contenu vers la fenêtre parente (postMessage) pour que
 * l'iframe d'intégration s'auto-redimensionne. Aucune donnée sensible : la
 * cible peut rester "*".
 */
export function EmbedResizer() {
  useEffect(() => {
    const send = () => {
      window.parent?.postMessage(
        {
          type: "sinvestir:embed-height",
          height: document.documentElement.scrollHeight,
        },
        "*",
      );
    };

    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return null;
}
