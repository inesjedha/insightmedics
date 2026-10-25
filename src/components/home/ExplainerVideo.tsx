import { Check, FileSpreadsheet, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Logo } from "@/components/site/Logo";
import { getOffer, weeksLabel } from "@/lib/offers";
import { cn } from "@/lib/utils";
import "./explainer.css";

/**
 * « Vidéo » explicative de l'accueil : 5 scènes animées en HTML/CSS (aucun fichier
 * vidéo à charger, texte net à toutes les tailles, traduisible et modifiable ici).
 * - Lecture automatique, en boucle, uniquement quand elle est visible à l'écran.
 * - Bouton lecture/pause et chapitres cliquables ; transcription lue par les lecteurs
 *   d'écran ; mouvement réduit respecté (pas de lecture auto, états finaux affichés).
 */

type Scene = {
  title: string;
  note: string;
  duration: number;
  render: () => ReactNode;
};

const these = getOffer("these");

const SCENES: Scene[] = [
  {
    title: "Vous déposez votre base.",
    note: "SPSS, Excel ou CSV",
    duration: 5000,
    render: () => <UploadScene />,
  },
  {
    title: "On la vérifie, ligne par ligne.",
    note: "erreurs, doublons, données manquantes",
    duration: 5500,
    render: () => <CheckScene />,
  },
  {
    title: "Vous savez quoi corriger.",
    note: "score sur 100, gratuit et immédiat",
    duration: 5000,
    render: () => <ScoreScene />,
  },
  {
    title: "On analyse et on rédige avec vous.",
    note: "relu par un médecin et un biostatisticien",
    duration: 6000,
    render: () => <WriteScene />,
  },
  {
    title: "Vous soutenez sereinement.",
    note: `thèse complète en ${weeksLabel(these.delayWeeks)} · ${these.priceLabel}`,
    duration: 4500,
    render: () => <EndScene />,
  },
];

const TOTAL_SECONDS = Math.round(SCENES.reduce((t, s) => t + s.duration, 0) / 1000);

/** Décalage d'animation : style={delay(0.4)}. */
function delay(seconds: number, extra?: Record<string, string>): CSSProperties {
  return { "--ev-delay": `${seconds}s`, ...extra } as CSSProperties;
}

export function ExplainerVideo({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  // Incrémenté à chaque changement de scène : remonte la scène (animations rejouées).
  const [cycle, setCycle] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(SCENES[0].duration);
  const startedAt = useRef(0);

  const playing = inView && !paused;

  // Mouvement réduit : pas de lecture automatique.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  // Ne joue que si au moins 40 % de la vidéo est à l'écran.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Durée restante de la scène courante (reprise exacte après une pause).
  useEffect(() => {
    remaining.current = SCENES[scene].duration;
  }, [scene, cycle]);

  useEffect(() => {
    if (!playing) return;
    startedAt.current = performance.now();
    const timer = window.setTimeout(() => {
      setScene((s) => (s + 1) % SCENES.length);
      setCycle((c) => c + 1);
    }, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
    };
  }, [playing, scene, cycle]);

  const goTo = (i: number) => {
    setScene(i);
    setCycle((c) => c + 1);
  };

  const current = SCENES[scene];

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="vidéo explicative"
      aria-label={`Comment ça marche, en ${TOTAL_SECONDS} secondes`}
      className={cn(
        "ev-stage @container relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-md border border-foreground bg-paper shadow-offset",
        className,
      )}
      style={{ "--ev-play": playing ? "running" : "paused" } as CSSProperties}
    >
      <div className="flex items-center justify-between border-b border-foreground/15 bg-background/80 px-[5cqw] py-[3cqw] text-[max(10px,2.6cqw)] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>Comment ça marche</span>
        <span aria-hidden>
          {scene + 1} / {SCENES.length}
        </span>
      </div>

      {/* Scène animée : décorative, le sens est porté par la légende et la transcription. */}
      <div className="relative flex-1" aria-hidden>
        <div
          key={`${scene}-${cycle}`}
          className="absolute inset-0 flex items-center justify-center p-[6cqw]"
        >
          {current.render()}
        </div>
      </div>

      <div className="border-t border-foreground/15 bg-background px-[5cqw] pb-[3.5cqw] pt-[4cqw]">
        <p
          key={`t-${scene}-${cycle}`}
          className="ev-fade-up font-display text-[max(22px,7cqw)] leading-[1.05]"
          aria-live={paused ? "polite" : "off"}
        >
          {current.title}
        </p>
        <p
          key={`n-${scene}-${cycle}`}
          className="ev-fade-up mt-[1cqw] font-hand text-[max(18px,5cqw)] leading-tight text-brand"
          style={delay(0.25)}
          aria-hidden
        >
          {current.note}
        </p>

        <div className="mt-[3.5cqw] flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Lire la vidéo" : "Mettre la vidéo en pause"}
            className="inline-flex size-[max(44px,9cqw)] shrink-0 items-center justify-center rounded-md border border-foreground bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {paused ? (
              <Play className="size-[max(16px,3.4cqw)]" />
            ) : (
              <Pause className="size-[max(16px,3.4cqw)]" />
            )}
          </button>
          <ol className="flex flex-1 gap-1.5" aria-label="Étapes de la vidéo">
            {SCENES.map((s, i) => (
              <li key={s.title} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Étape ${i + 1} : ${s.title}`}
                  aria-current={i === scene ? "step" : undefined}
                  className="group flex h-[max(44px,9cqw)] w-full items-center focus-visible:outline-none"
                >
                  <span className="relative block h-[max(6px,1.2cqw)] w-full overflow-hidden rounded-full bg-foreground/15 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
                    {i < scene && <span className="absolute inset-0 bg-foreground" />}
                    {i === scene && (
                      <span
                        key={cycle}
                        className="ev-progress absolute inset-0 bg-brand"
                        style={{ "--ev-duration": `${s.duration}ms` } as CSSProperties}
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ol className="sr-only">
        {SCENES.map((s) => (
          <li key={s.title}>
            {s.title} ({s.note})
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------- Scènes */

function UploadScene() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-foreground/35 bg-background/70 p-[6cqw]">
      <div
        className="ev-drop flex w-[88%] items-center gap-[3cqw] rounded-md border border-foreground bg-card p-[4cqw] shadow-offset"
        style={delay(0.3)}
      >
        <FileSpreadsheet className="h-[9cqw] w-[9cqw] shrink-0 text-brand" />
        <div className="min-w-0">
          <p className="truncate text-[max(13px,4.2cqw)] font-semibold">these_cardio.sav</p>
          <p className="text-[max(11px,3.2cqw)] text-muted-foreground">
            51 patients · 130 variables
          </p>
        </div>
      </div>
      <div className="mt-[6cqw] h-[1.6cqw] w-[88%] overflow-hidden rounded-full bg-foreground/10">
        <div className="ev-fill h-full w-full bg-brand" style={delay(1.3)} />
      </div>
      <p
        className="ev-fade-up mt-[4cqw] flex items-center gap-2 text-[max(13px,4cqw)] font-semibold"
        style={delay(2.6)}
      >
        <Check className="h-[5cqw] w-[5cqw] text-brand" /> Fichier reçu
      </p>
    </div>
  );
}

const ROWS = [
  { id: "P-012", age: "54", sexe: "F", saps: "33" },
  { id: "P-013", age: "61", sexe: "M", saps: "45" },
  { id: "P-014", age: "212", sexe: "F", saps: "38", flag: "age" },
  { id: "P-015", age: "47", sexe: "M", saps: "", flag: "missing" },
  { id: "P-015", age: "47", sexe: "M", saps: "", flag: "dup" },
] as const;

function CheckScene() {
  return (
    <div className="relative w-full rounded-md border border-foreground bg-card p-[4cqw] text-[max(12px,3.8cqw)]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-foreground text-left">
            <th className="py-[1.4cqw] font-semibold">id</th>
            <th className="py-[1.4cqw] font-semibold">âge</th>
            <th className="py-[1.4cqw] font-semibold">sexe</th>
            <th className="py-[1.4cqw] font-semibold">SAPS II</th>
          </tr>
        </thead>
        <tbody className="relative">
          {ROWS.map((r, i) => {
            const flag = "flag" in r ? r.flag : undefined;
            // Doublon : un trait par cellule, enchaînés pour barrer toute la ligne.
            const strike = (cell: number) =>
              flag === "dup" && (
                <span
                  className="ev-strike absolute inset-x-0 top-1/2 h-[2px] bg-brand"
                  style={delay(3.1 + cell * 0.1)}
                />
              );
            return (
              <tr
                key={i}
                className="ev-fade-up border-b border-border"
                style={delay(0.1 + i * 0.12)}
              >
                <td className="relative py-[1.6cqw]">
                  {r.id}
                  {strike(0)}
                </td>
                <td className="relative py-[1.6cqw]">
                  {r.age}
                  {flag === "age" && (
                    <span
                      className="ev-circle absolute -inset-x-[2cqw] -inset-y-[0.4cqw] rounded-[50%] border-2 border-brand"
                      style={delay(2.3)}
                    />
                  )}
                  {strike(1)}
                </td>
                <td className="relative py-[1.6cqw]">
                  {r.sexe}
                  {strike(2)}
                </td>
                <td className="relative py-[1.6cqw]">
                  {r.saps || (
                    <span
                      className={cn("px-1", flag === "missing" && "ev-fade-up mark")}
                      style={delay(3.4)}
                    >
                      ?
                    </span>
                  )}
                  {strike(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
        className="ev-scan pointer-events-none absolute inset-x-[4cqw] top-[11cqw] h-[7cqw] rounded-sm bg-brand/15"
        style={delay(0.8, { "--ev-scan-distance": "34cqw" })}
      />
      <p
        className="ev-fade-up mt-[3cqw] font-hand text-[max(16px,5cqw)] leading-tight text-brand"
        style={delay(3.6)}
      >
        âge impossible · doublon · manquant
      </p>
    </div>
  );
}

function ScoreScene() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(64);
      return;
    }
    let raf = 0;
    const start = performance.now() + 300;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / 1200));
      setN(Math.round(64 * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fixes = [
    "Corriger 1 âge impossible",
    "Supprimer 3 doublons",
    "Compléter 12 % de données manquantes",
  ];

  return (
    <div className="w-full rounded-md border border-foreground bg-card p-[5cqw]">
      <div className="flex items-baseline justify-between">
        <span className="text-[max(12px,3.6cqw)] text-muted-foreground">Score de la base</span>
        <span className="font-display text-[max(44px,17cqw)] leading-none tabular-nums">
          {n}
          <span className="text-[0.38em] text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="mt-[3cqw] grid grid-cols-10 gap-[1cqw]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[2cqw] overflow-hidden rounded-full bg-foreground/10">
            {i < 6 && (
              <span
                className={cn("ev-fill block h-full", i === 5 ? "bg-highlight" : "bg-brand")}
                style={delay(0.3 + i * 0.12)}
              />
            )}
          </span>
        ))}
      </div>
      <ul className="mt-[5cqw] space-y-[2.4cqw] text-[max(12px,3.8cqw)]">
        {fixes.map((f, i) => (
          <li
            key={f}
            className="ev-fade-up flex items-center gap-[2.5cqw]"
            style={delay(1.7 + i * 0.45)}
          >
            <span className="inline-flex h-[5cqw] w-[5cqw] shrink-0 items-center justify-center rounded-sm border-2 border-brand">
              <Check className="h-[3.6cqw] w-[3.6cqw] text-brand" />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WriteScene() {
  const bars = [62, 88, 45, 74];
  return (
    <div className="relative w-full rounded-md border border-foreground bg-card p-[5cqw]">
      <p className="font-display text-[max(18px,6cqw)] leading-none">3. Résultats</p>
      <div className="mt-[3cqw] space-y-[1.8cqw]">
        {[100, 92, 97, 70].map((w, i) => (
          <div
            key={i}
            className="h-[1.6cqw] rounded-full bg-foreground/10"
            style={{ width: `${w}%` }}
          >
            <div
              className="ev-fill h-full rounded-full bg-foreground/45"
              style={delay(0.2 + i * 0.3)}
            />
          </div>
        ))}
      </div>
      <div className="mt-[4cqw] flex h-[24cqw] items-end gap-[3cqw] border-b-2 border-l-2 border-foreground px-[3cqw]">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn("ev-grow flex-1 rounded-t-sm", i === 1 ? "bg-brand" : "bg-foreground/35")}
            style={{ ...delay(1.4 + i * 0.18), height: `${h}%` }}
          />
        ))}
      </div>
      <p
        className="ev-fade-up mt-[1.5cqw] text-[max(10px,3cqw)] italic text-muted-foreground"
        style={delay(2.2)}
      >
        Figure 2 — Évolution du score SAPS II
      </p>
      <span
        className="ev-stamp absolute right-[4cqw] top-[5cqw] rounded-sm border-2 border-brand bg-background px-[2cqw] py-[0.6cqw] font-hand text-[max(14px,4.6cqw)] leading-none text-brand"
        style={delay(3.2, { "--ev-rot": "-7deg" })}
      >
        relu · médecin
      </span>
      <span
        className="ev-stamp absolute right-[6cqw] top-[26cqw] rounded-sm border-2 border-brand bg-background px-[2cqw] py-[0.6cqw] font-hand text-[max(14px,4.6cqw)] leading-none text-brand"
        style={delay(3.8, { "--ev-rot": "5deg" })}
      >
        relu · biostatisticien
      </span>
    </div>
  );
}

function EndScene() {
  return (
    <div className="flex flex-col items-center text-center">
      <Logo className="ev-fade-up text-[max(34px,13cqw)] sm:text-[max(34px,13cqw)]" />
      <p
        className="ev-fade-up mt-[5cqw] max-w-[85%] text-[max(14px,4.4cqw)] leading-snug text-muted-foreground"
        style={delay(0.4)}
      >
        Statistiques et rédaction de votre thèse de médecine, relues par un médecin et un
        biostatisticien.
      </p>
      <p
        className="ev-fade-up mt-[5cqw] rounded-md bg-primary px-[5cqw] py-[2.6cqw] text-[max(14px,4.4cqw)] font-semibold text-primary-foreground"
        style={delay(0.9)}
      >
        Testez votre base gratuitement
      </p>
    </div>
  );
}
