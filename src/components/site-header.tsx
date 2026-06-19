import { EmbedDialog } from "@/features/simulator/components/embed-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden />
          <span className="font-semibold tracking-tight">
            S&apos;investir{" "}
            <span className="font-normal text-muted-foreground">
              Simulateurs
            </span>
          </span>
        </div>
        <EmbedDialog />
      </div>
    </header>
  );
}
