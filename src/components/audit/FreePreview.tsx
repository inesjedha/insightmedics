/**
 * Résultats du test gratuit (page /audit), pour un étudiant qui découvre sa base.
 *
 * Même langage visuel que le bilan de l'audit complet (ClientReport), dans un ordre pensé
 * pour donner envie d'aller plus loin sans rien cacher : le verdict d'abord, puis la
 * preuve, puis ce que le test gratuit ne peut pas voir, puis l'offre.
 * - Chaque constat montre une preuve chiffrée tirée du fichier ; la liste ligne par ligne
 *   est réservée à l'audit complet (on dit qu'elle existe, combien, et où l'obtenir).
 * - Rien n'est noté de ce que le code ne peut pas juger : ces contrôles sont listés à part.
 * - Aucune promesse que l'audit ne tient pas : bilan à l'écran, missions, questions pour le
 *   directeur et classeur Excel (la base nettoyée vient avec l'analyse statistique).
 */
import { useEffect, useState } from "react";
import { ArrowDown, Check, Lock, MessageCircle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditResult, PreviewFinding, PreviewLight, PreviewView } from "@/lib/api/types";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { CopiesVisual, PatientCount, ScoreGauge, SectionTitle, Tile } from "./ClientReport";
import { UNLOCK_ANCHOR_ID } from "./UnlockRequestForm";

const OFFER_ANCHOR_ID = "audit-complet";

const DOT: Record<PreviewLight, string> = {
  rouge: "bg-destructive",
  orange: "bg-amber-500",
  vert: "bg-brand",
  gris: "bg-muted-foreground/40",
};

const BADGE: Record<PreviewFinding["light"], { label: string; className: string }> = {
  rouge: { label: "Urgent", className: "bg-destructive/10 text-destructive" },
  orange: { label: "À vérifier", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  gris: { label: "Pour info", className: "bg-muted text-muted-foreground" },
};

const BORDER: Record<PreviewFinding["light"], string> = {
  rouge: "border-l-destructive",
  orange: "border-l-amber-500",
  gris: "border-l-border",
};

const UNIT: Record<PreviewFinding["unit"], [string, string]> = {
  case: ["case", "cases"],
  ligne: ["ligne", "lignes"],
  valeur: ["valeur", "valeurs"],
};

function plural(n: number, [one, many]: [string, string]): string {
  return `${n.toLocaleString("fr-FR")} ${n > 1 ? many : one}`;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Message WhatsApp prérempli : la note seulement, aucune donnée du fichier. */
function whatsappUrl(score: number): string {
  const text = `Bonjour Dr Hamza, je viens de faire le test gratuit de ma base sur Insight Medics (note provisoire : ${score}/100). J'aimerais en savoir plus sur l'audit complet.`;
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`;
}

/* ------------------------------------------------------------------ verdict */

function PreviewHero({
  result,
  view,
  onRestart,
}: {
  result: AuditResult;
  view: PreviewView;
  onRestart: () => void;
}) {
  const patients = result.patientCount || result.rowCount;
  const patientMin = result.patientMin ?? patients;
  const range = result.duplicatedRows > 0 && patientMin < patients;
  const extraRows = result.rowCount - patients;
  const problems = view.findings.filter((f) => f.light !== "gris");
  const urgent = problems.filter((f) => f.light === "rouge").length;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-stretch gap-8 p-6 sm:p-8">
        <div className="min-w-0 flex-[999_1_440px] space-y-4">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Test gratuit · {result.fileName}
          </p>
          <h2 className="flex items-start gap-3 text-4xl text-foreground sm:text-5xl">
            <span
              className={cn("mt-3 h-4 w-4 shrink-0 rounded-full sm:mt-4", DOT[view.verdict.light])}
              aria-hidden
            />
            {view.verdict.title}
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-foreground/80">
            {view.verdict.text}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <Button size="lg" onClick={() => scrollTo(OFFER_ANCHOR_ID)}>
              Voir l'audit complet · {FULL_AUDIT_PRICE_LABEL}
            </Button>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Tester un autre fichier
            </button>
          </div>
        </div>
        <div className="flex-[1_1_240px]">
          <ScoreGauge score={view.score} caption="Note provisoire" />
        </div>
      </div>
      <dl className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
        <Tile
          label="Patients"
          value={range ? `${patientMin} à ${patients}` : patients.toLocaleString("fr-FR")}
          hint={
            range
              ? "selon les copies à vérifier"
              : extraRows > 0
                ? `+ ${plural(extraRows, ["ligne", "lignes"])} à retirer`
                : `${result.columnCount} variables`
          }
        />
        <Tile
          label="Problèmes trouvés"
          value={String(problems.length)}
          hint={urgent ? `dont ${urgent} urgent${urgent > 1 ? "s" : ""}` : "rien d'urgent"}
          alert={urgent > 0}
        />
        <Tile
          label="À vérifier dans vos dossiers"
          value={view.to_check.toLocaleString("fr-FR")}
          hint="cases et lignes repérées"
          alert={view.to_check > 0}
        />
        <Tile
          label="Contrôles faits"
          value={String(view.checks.n_done)}
          hint={`+ ${view.checks.n_reserved} dans l'audit complet`}
        />
      </dl>
    </section>
  );
}

/* ---------------------------------------------------------------- constats */

function LockedList({ finding }: { finding: PreviewFinding }) {
  return (
    <div className="space-y-2.5 rounded-lg border border-dashed border-border px-4 py-3">
      <p className="flex items-start gap-2.5 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        <span>
          <span className="font-semibold">
            {plural(finding.count, UNIT[finding.unit])} à vérifier.
          </span>{" "}
          <span className="text-foreground/70">
            Les lignes à ouvrir dans vos dossiers, avec leur numéro, sont dans l'audit complet.
          </span>
        </span>
      </p>
      {/* Liste masquée : simples barres, aucune donnée. */}
      <div className="space-y-1.5 pl-6" aria-hidden>
        {["w-3/4", "w-1/2", "w-2/3"].map((w) => (
          <div key={w} className={cn("h-2 rounded-full bg-muted", w)} />
        ))}
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  proofAbove = false,
}: {
  finding: PreviewFinding;
  /** La preuve est déjà montrée par un schéma au-dessus (lignes recopiées). */
  proofAbove?: boolean;
}) {
  const badge = BADGE[finding.light];
  const proof = proofAbove ? "Le schéma ci-dessus montre où elles se trouvent." : finding.proof;
  return (
    <article
      className={cn(
        "space-y-3 rounded-xl border border-l-4 border-border bg-card p-5 sm:p-6",
        BORDER[finding.light],
      )}
    >
      <div className="space-y-1.5">
        <span
          className={cn(
            "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
            badge.className,
          )}
        >
          {badge.label}
        </span>
        <h3 className="font-sans text-lg font-bold leading-snug">{finding.title}</h3>
      </div>
      <p className="leading-relaxed text-foreground/80">{finding.why}</p>
      {proof && (
        <div className="rounded-lg bg-muted/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Dans votre fichier
          </p>
          <p className="mt-1 leading-relaxed">{proof}</p>
        </div>
      )}
      {finding.count > 0 && <LockedList finding={finding} />}
    </article>
  );
}

function Findings({ result, view }: { result: AuditResult; view: PreviewView }) {
  if (!view.findings.length) return null;
  const hasDiagram = !!result.copies && result.copies.blocks.length > 0;
  return (
    <section className="space-y-4">
      <SectionTitle
        title="Ce que nous avons repéré"
        note={
          view.to_check
            ? `${view.to_check.toLocaleString("fr-FR")} cases et lignes à vérifier`
            : undefined
        }
        intro="Chaque problème, ce qu'il change pour votre thèse, et la preuve trouvée dans votre fichier. Les plus urgents d'abord."
      />
      {hasDiagram && result.copies && <CopiesVisual copies={result.copies} />}
      <div className="space-y-4">
        {view.findings.map((f) => (
          <FindingCard key={f.key} finding={f} proofAbove={hasDiagram && f.key === "copies"} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------- ce que le test ne peut pas voir */

function Checks({ view }: { view: PreviewView }) {
  const { n_done, n_reserved, reserved } = view.checks;
  if (!n_reserved) return null;
  return (
    <section className="space-y-4">
      <SectionTitle
        title="Ce que le test gratuit ne peut pas voir"
        intro="Le code vérifie la forme de votre tableau. Il ne peut pas juger s'il répond à votre question de recherche : c'est le travail de l'audit complet."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
          <p className="flex items-center gap-2 font-bold">
            <Check className="h-5 w-5 text-brand" aria-hidden /> {n_done} contrôles faits
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Doublons et copies, cases vides, codes comme 999, dates impossibles, formats, données
            qui permettent de reconnaître un patient.
          </p>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6 lg:col-span-3">
          <p className="flex items-center gap-2 font-bold">
            <Lock className="h-5 w-5 text-brand" aria-hidden /> {n_reserved} contrôles dans l'audit
            complet
          </p>
          <ul className="space-y-2.5">
            {reserved.map((r) => (
              <li key={r.name} className="text-sm leading-relaxed">
                <span className="font-semibold">{r.name}</span>
                <span className="text-foreground/70"> : {r.example}.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Votre note de {view.score}/100 est provisoire : une partie de ses points dépend de ces{" "}
        {n_reserved} contrôles, faits seulement dans l'audit complet.
      </p>
    </section>
  );
}

/* --------------------------------------------------------------------- offre */

function OfferCompare({ view }: { view: PreviewView }) {
  const rows: { label: string; free: boolean }[] = [
    { label: "Votre note et les problèmes principaux", free: true },
    {
      label: "Les lignes à ouvrir dans vos dossiers, avec leur numéro",
      free: false,
    },
    { label: "Vos missions aux archives, de la plus urgente à la moins urgente", free: false },
    { label: "Les questions à poser à votre directeur de thèse", free: false },
    {
      label: `Les ${view.checks.n_reserved} contrôles de fond : protocole, critère principal, calculs prévus`,
      free: false,
    },
    { label: "Votre classeur Excel, prêt à imprimer et à remplir aux archives", free: false },
  ];
  return (
    <section
      id={OFFER_ANCHOR_ID}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-foreground bg-card shadow-offset"
    >
      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Audit complet · {FULL_AUDIT_PRICE_LABEL}
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Savoir exactement quoi corriger, et où.</h2>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <th className="pb-2 font-semibold" scope="col">
                  <span className="sr-only">Contenu</span>
                </th>
                <th className="w-14 pb-2 text-center font-semibold sm:w-20" scope="col">
                  Gratuit
                </th>
                <th className="w-14 pb-2 text-center font-semibold text-brand sm:w-20" scope="col">
                  Complet
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-2.5 pr-3 leading-snug">{r.label}</td>
                  <td className="py-2.5 text-center">
                    {r.free ? (
                      <Check className="mx-auto h-4 w-4 text-brand" aria-label="Inclus" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground/60" aria-label="Non" />
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <Check className="mx-auto h-4 w-4 text-brand" aria-label="Inclus" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col justify-center gap-4 border-t border-border bg-accent/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="font-display text-6xl leading-none">{FULL_AUDIT_PRICE_LABEL}</p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li>Vous ne payez qu'après nous avoir parlé.</li>
            <li>Nous vous rappelons sous 48&nbsp;h ouvrées.</li>
            <li>Votre fichier d'origine n'est jamais modifié.</li>
          </ul>
          <Button size="lg" onClick={() => scrollTo(UNLOCK_ANCHOR_ID)}>
            Demander l'audit complet <ArrowDown />
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={whatsappUrl(view.score)} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Une question ? WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Rappel collant sur mobile, une fois le verdict lu, masqué quand l'offre ou le
 * formulaire sont à l'écran. */
function StickyOffer() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const onScreen = (id: string) => {
        const r = document.getElementById(id)?.getBoundingClientRect();
        return r ? r.top < vh && r.bottom > 0 : false;
      };
      setVisible(
        window.scrollY > vh * 0.9 && !onScreen(OFFER_ANCHOR_ID) && !onScreen(UNLOCK_ANCHOR_ID),
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform md:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={() => scrollTo(OFFER_ANCHOR_ID)}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 font-semibold text-brand-foreground"
      >
        Voir l'audit complet · {FULL_AUDIT_PRICE_LABEL}
      </button>
    </div>
  );
}

export function FreePreview({
  result,
  view,
  onRestart,
}: {
  result: AuditResult;
  view: PreviewView;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-12">
      <PreviewHero result={result} view={view} onRestart={onRestart} />
      <PatientCount result={result} />
      <Findings result={result} view={view} />
      <Checks view={view} />
      <OfferCompare view={view} />
      <StickyOffer />
    </div>
  );
}
