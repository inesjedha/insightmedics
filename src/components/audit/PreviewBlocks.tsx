import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditResult } from "@/lib/api/types";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";
import { cn } from "@/lib/utils";
import { UNLOCK_ANCHOR_ID } from "./UnlockRequestForm";

const FULL_AUDIT_INCLUDES = [
  "Un verdict clair : votre base est-elle exploitable pour votre thèse ?",
  "Chaque anomalie classée et expliquée, avec la correction proposée",
  "Un plan de correction par ordre de priorité, étape par étape",
  "Le classeur Excel d'audit (10 onglets) et le rapport Word complet",
  "Votre base nettoyée et anonymisée (.sav et .csv), prête à analyser",
];

function scrollToUnlock() {
  document.getElementById(UNLOCK_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PreviewNotice({ nIssues }: { nIssues: number }) {
  return (
    <div className="rounded-md border border-foreground bg-card p-6 shadow-offset sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Test gratuit</p>
      <p className="mt-2 font-display text-3xl">Voici votre premier diagnostic.</p>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed">
        {nIssues > 0 ? (
          <>
            Nous avons repéré{" "}
            <strong>
              {nIssues} point{nIssues > 1 ? "s" : ""} d'attention
            </strong>{" "}
            sur votre base. L'audit complet ({FULL_AUDIT_PRICE_LABEL}) vous dit exactement{" "}
            <strong>comment les corriger</strong> et vous remet :
          </>
        ) : (
          <>
            Bonne base à première vue. L'<strong>audit complet ({FULL_AUDIT_PRICE_LABEL})</strong>{" "}
            le confirme et va beaucoup plus loin. Il vous remet :
          </>
        )}
      </p>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {FULL_AUDIT_INCLUDES.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[15px]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Button onClick={scrollToUnlock} className="mt-6">
        Débloquer l'audit complet · {FULL_AUDIT_PRICE_LABEL}
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
        {" · "}
        {nIssues === 0
          ? "aucun point d'attention majeur détecté."
          : `${nIssues} point${nIssues > 1 ? "s" : ""} d'attention${
              nCrit ? `, dont ${nCrit} critique${nCrit > 1 ? "s" : ""}` : ""
            }.`}
      </span>
    </div>
  );
}

export function DeliverablesPreview() {
  const items = [
    { label: "Classeur Excel", sub: "10 onglets d'audit", accent: "bg-brand" },
    { label: "Rapport Word", sub: "11 sections rédigées", accent: "bg-foreground" },
    { label: "Base nettoyée", sub: ".sav et .csv anonymisés", accent: "bg-highlight" },
  ];
  return (
    <div className="rounded-md border border-border bg-card p-6 sm:p-8">
      <h3 className="text-lg font-semibold">Ce que vous recevez avec l'audit complet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Trois fichiers prêts à l'emploi, en plus du détail de l'audit à l'écran.
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
