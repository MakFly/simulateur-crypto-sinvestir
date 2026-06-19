import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/site-header";
import { TLDR } from "./content";

export const metadata: Metadata = {
  title: "TL;DR | Simulateur Crypto S'investir",
  description: "Résumé du projet : mission, stack, fonctionnalités et choix techniques.",
};

export default function TldrPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <article className="prose prose-invert max-w-none prose-headings:tracking-tight prose-a:text-primary prose-code:text-brand prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{TLDR}</ReactMarkdown>
        </article>
      </main>
    </>
  );
}
