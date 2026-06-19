import Link from "next/link";
import { EmbedDialog } from "@/features/simulator/components/embed-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden />
          <span className="font-semibold tracking-tight">
            S&apos;investir{" "}
            <span className="font-normal text-muted-foreground">
              Simulateurs
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/tldr"
            className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            TL;DR
          </Link>
          <EmbedDialog />
        </div>
      </div>
    </header>
  );
}
