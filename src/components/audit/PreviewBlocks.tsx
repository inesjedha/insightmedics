import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditResult } from "@/lib/api/types";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";
import { cn } from "@/lib/utils";
import { UNLOCK_ANCHOR_ID } from "./UnlockRequestForm";

const FULL_AUDIT_INCLUDES = [
  "Le verdict clair : votre base est-elle exploitable pour publier ?",
  "Chaque anomalie classée, expliquée, avec une correction proposée",
  "Un plan d'action priorisé, étape par étape",
  "Le classeur Excel d'audit (10 onglets) + le rapport Word complet",
  "Votre base nettoyée et anonymisée (.sav + .csv), prête à analyser",
];

function scrollToUnlock() {
  document.getElementById(UNLOCK_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PreviewNotice({ nIssues }: { nIssues: number }) {
  return (
    <div className="rounded-md border border-brand/30 bg-brand/5 p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles className="h-5 w-5 text-brand" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Aperçu gratuit
        </p>
      </div>
      <p className="mt-2 font-display text-xl font-bold tracking-tight">
        Voici un premier diagnostic — gratuit et automatique.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/85">
        {nIssues > 0 ? (
          <>
            Nous avons repéré <strong>{nIssues} point(s) d'attention</strong> sur votre base.
            L'audit complet vous dit exactement <strong>comment les corriger</strong> et vous livre
            :
          </>
        ) : (
          <>
            Bonne base à première vue. L'<strong>audit complet ({FULL_AUDIT_PRICE_LABEL})</strong>{" "}
            confirme et va beaucoup plus loin — il vous livre :
          </>
        )}
      </p>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {FULL_AUDIT_INCLUDES.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={scrollToUnlock}
        className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90"
      >
        Débloquer l'audit complet — {FULL_AUDIT_PRICE_LABEL}
      </Button>
    </div>
  );
}

export function ResultsSummary({
  result,
  nIssues,
  nCrit,
}: {
  result: AuditResult;
  nIssues: number;
  nCrit: number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface/60 px-5 py-3.5 text-sm">
      <span className="font-medium text-foreground">
        Base de {result.rowCount.toLocaleString("fr-FR")} lignes × {result.columnCount} variables
      </span>
      <span className="text-muted-foreground">
        {" — "}
        {nIssues === 0
          ? "aucun point d'attention majeur détecté."
          : `${nIssues} point(s) d'attention${nCrit ? `, dont ${nCrit} critique(s)` : ""}.`}
      </span>
    </div>
  );
}

export function DeliverablesPreview() {
  const items = [
    { label: "Classeur Excel", sub: "10 onglets d'audit", accent: "bg-emerald-500" },
    { label: "Rapport Word", sub: "11 sections rédigées", accent: "bg-blue-500" },
    { label: "Base nettoyée", sub: ".sav + .csv anonymisés", accent: "bg-brand" },
  ];
  return (
    <div className="rounded-md border border-border bg-card p-6 sm:p-8">
      <h3 className="font-sans text-lg font-bold">Ce que vous recevez après paiement</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Trois livrables prêts à l'emploi, en plus de l'audit complet à l'écran.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-md border border-border bg-surface/50 p-4">
            <div className="flex flex-col gap-1.5" aria-hidden>
              <div className={cn("h-2 w-10 rounded-full", it.accent)} />
              <div className="h-1.5 w-full rounded bg-border" />
              <div className="h-1.5 w-11/12 rounded bg-border" />
              <div className="h-1.5 w-4/5 rounded bg-border" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{it.label}</p>
            <p className="text-xs text-muted-foreground">{it.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
