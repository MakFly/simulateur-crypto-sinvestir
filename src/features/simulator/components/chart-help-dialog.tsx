"use client";

import { HelpCircle, MousePointer2, RotateCcw, ZoomIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: MousePointer2,
    text: "Glisse horizontalement sur le graphe pour sélectionner une plage de dates.",
  },
  {
    icon: ZoomIn,
    text: "Relâche : le graphe zoome sur la période choisie et l'étale sur toute la largeur.",
  },
  {
    icon: RotateCcw,
    text: "Clique sur « Réinitialiser » (en haut à droite) pour revenir à la vue complète.",
  },
];

export function ChartHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="Aide : zoom du graphe"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "text-muted-foreground",
        )}
      >
        <HelpCircle className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zoomer sur une période</DialogTitle>
          <DialogDescription>
            Explore une plage de dates précise directement sur le graphe.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <step.icon className="size-4" />
              </span>
              <span className="pt-1 text-muted-foreground">{step.text}</span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
