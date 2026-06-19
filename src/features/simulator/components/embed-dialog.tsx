"use client";

import { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function buildSnippet(origin: string): string {
  return `<iframe
  src="${origin}/embed"
  style="width:100%;border:0;height:720px"
  loading="lazy"
  title="Simulateur crypto S'investir">
</iframe>`;
}

export function EmbedDialog() {
  const [snippet, setSnippet] = useState("");
  const [copied, setCopied] = useState(false);

  function handleOpenChange(open: boolean) {
    // l'URL est calculée au runtime -> fonctionne en local comme sur Vercel
    if (open && typeof window !== "undefined") {
      setSnippet(buildSnippet(window.location.origin));
    }
    if (!open) setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible (contexte non sécurisé) : on ignore silencieusement
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        <Code2 className="size-4" />
        Intégrer
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Intégrer le simulateur</DialogTitle>
          <DialogDescription>
            Colle ce code dans une page (bloc HTML) de{" "}
            <span className="text-foreground">sinvestir.fr</span> pour afficher
            le simulateur en aperçu.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-w-0">
          <pre className="rounded-lg border border-border bg-secondary p-3 pr-12 text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground">
            <code>{snippet}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label="Copier le code"
            className="absolute top-2 right-2"
          >
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Le composant est autonome : aucune dépendance au reste du site, il se
          charge dans son iframe via la route{" "}
          <code className="text-foreground">/embed</code>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
