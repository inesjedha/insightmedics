import { FileSpreadsheet, Pause, Play } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Logo } from "@/components/site/Logo";
import { LOWEST_PRICE_LABEL } from "@/lib/offers";
import { frTypo } from "@/lib/typo";
import { cn } from "@/lib/utils";
import "./explainer.css";

/**
 * « Vidéo » explicative de l'accueil : 5 scènes animées en HTML/CSS (aucun fichier
 * vidéo à charger, texte net à toutes les tailles, modifiable ici comme le reste du site).
 * - Lecture automatique et en boucle, seulement quand elle est à l'écran et l'onglet visible.
 * - Bouton lecture/pause (gèle aussi les animations) et chapitres cliquables.
 * - Transcription complète pour les lecteurs d'écran ; changement d'étape annoncé.
 * - Mouvement réduit : pas de lecture automatique, chaque scène montrée dans son état final.
 */

type Scene = {
  title: string;
  note: string;
  duration: number;
  render: () => ReactNode;
};

const SCENES: Scene[] = [
  {
    title: "Vous déposez votre base.",
    note: "SPSS, Excel ou CSV",
    duration: 5000,
    render: () => <UploadScene />,
  },
  {
    title: "Notre code la vérifie, ligne par ligne.",
    note: "valeurs extrêmes, doublons, manquants",
    duration: 6500,
    render: () => <CheckScene />,
  },
  {
    title: "Vous voyez ce qui bloque.",
    note: "score sur 100 · gratuit, en quelques minutes",
    duration: 5500,
    render: () => <ScoreScene />,
  },
  {
    title: "On analyse et on rédige avec vous.",
    note: "relu par un médecin et un biostatisticien",
    duration: 6500,
    render: () => <WriteScene />,
  },
  {
    title: "Vous soutenez sereinement.",
    note: frTypo(`dès ${LOWEST_PRICE_LABEL} · payé à la livraison`),
    duration: 5000,
    render: () => <EndScene />,
  },
].map((s) => ({ ...s, title: frTypo(s.title) }));

const TOTAL_SECONDS = Math.round(SCENES.reduce((t, s) => t + s.duration, 0) / 1000);

/** Lecture en cours ? (lu par les scènes animées en JavaScript, comme le compteur.) */
const RunningContext = createContext(true);

/** Décalage d'animation : style={delay(0.4)}. */
function delay(seconds: number, extra?: Record<string, string>): CSSProperties {
  return { "--ev-delay": `${seconds}s`, ...extra } as CSSProperties;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Préférence « mouvement réduit », suivie si elle change pendant la visite. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function ExplainerVideo({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  // Incrémenté pour rejouer une scène depuis le début (changement, retour à l'écran).
  const [cycle, setCycle] = useState(0);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const remaining = useRef(SCENES[0].duration);
  const startedAt = useRef(0);

  // Par défaut : lecture, sauf en mouvement réduit. Le choix de la personne prime ensuite.
  const paused = userPaused ?? reducedMotion;
  const playing = inView && tabVisible && !paused;

  // Joue seulement si au moins 40 % de la vidéo est visible ; repart du début de la
  // scène en revenant à l'écran (sinon on arriverait au milieu d'une animation).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let wasInView = false;
    const io = new IntersectionObserver(
      (entries) => {
        // Plusieurs entrées possibles dans un même appel : seule la dernière compte.
        const now = entries[entries.length - 1].isIntersecting;
        if (now && !wasInView) setCycle((c) => c + 1);
        wasInView = now;
        setInView(now);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Nouvelle scène (ou scène rejouée) : durée complète.
  useEffect(() => {
    remaining.current = SCENES[scene].duration;
  }, [scene, cycle]);

  // Passage à la scène suivante ; la pause conserve le temps restant exact.
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
    if (!reducedMotion) setUserPaused(false);
    setAnnouncement(`Étape ${i + 1} sur ${SCENES.length} : ${SCENES[i].title} ${SCENES[i].note}.`);
  };

  const togglePause = () => {
    const next = !paused;
    setUserPaused(next);
    setAnnouncement(next ? "Vidéo en pause." : "Lecture.");
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
      // Les animations CSS ne gèlent que sur pause explicite : hors écran, le minuteur
      // s'arrête et la scène est rejouée au retour (voir plus haut).
      style={{ "--ev-play": paused ? "paused" : "running" } as CSSProperties}
    >
      <div className="flex items-center justify-between border-b border-foreground/15 bg-background/80 px-[5cqw] py-[3cqw] text-[max(11px,2.6cqw)] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>Comment ça marche</span>
        <span aria-hidden className="tabular-nums">
          {scene + 1} / {SCENES.length}
        </span>
      </div>

      {/* Scène animée : décorative, le sens est porté par la légende et la transcription. */}
      <div className="relative flex-1" aria-hidden>
        <div
          key={`${scene}-${cycle}`}
          className="absolute inset-0 flex items-center justify-center p-[6cqw]"
        >
          <RunningContext.Provider value={!paused}>{current.render()}</RunningContext.Provider>
        </div>
      </div>

      <div className="border-t border-foreground/15 bg-background px-[5cqw] pb-[3.5cqw] pt-[4cqw]">
        <div aria-hidden>
          <p
            key={`t-${scene}-${cycle}`}
            className="ev-fade-up font-display text-[max(22px,7cqw)] leading-[1.05]"
          >
            {current.title}
          </p>
          <p
            key={`n-${scene}-${cycle}`}
            className="ev-fade-up mt-[1cqw] font-hand text-[max(18px,5cqw)] leading-tight text-brand"
            style={delay(0.25)}
          >
            {current.note}
          </p>
        </div>

        <div className="mt-[3.5cqw] flex items-center gap-3">
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? "Lire la vidéo" : "Mettre la vidéo en pause"}
            className="inline-flex size-[max(44px,9cqw)] shrink-0 items-center justify-center rounded-md border border-foreground bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {paused ? (
              <Play aria-hidden className="size-[max(16px,3.4cqw)]" />
            ) : (
              <Pause aria-hidden className="size-[max(16px,3.4cqw)]" />
            )}
          </button>
          <ol className="flex flex-1 gap-1.5" aria-label="Chapitres de la vidéo">
            {SCENES.map((s, i) => (
              <li key={s.title} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Chapitre ${i + 1} : ${s.title}`}
                  aria-current={i === scene ? "step" : undefined}
                  className="group flex h-[max(44px,9cqw)] w-full items-center focus-visible:outline-none"
                >
                  <span className="relative block h-[max(6px,1.2cqw)] w-full overflow-hidden rounded-full bg-foreground/35 group-hover:bg-foreground/50 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
                    {i < scene && <span className="absolute inset-0 bg-foreground" />}
                    {i === scene && (
                      <span
                        key={cycle}
                        className="ev-progress absolute inset-0 bg-brand"
                        style={
                          {
                            "--ev-duration": `${s.duration}ms`,
                            // Hors écran, la barre attend avec le minuteur.
                            animationPlayState: playing ? "running" : "paused",
                          } as CSSProperties
                        }
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="sr-only">
        <p>Transcription :</p>
        <ol>
          {SCENES.map((s) => (
            <li key={s.title}>
              {s.title} ({s.note})
            </li>
          ))}
        </ol>
        <p aria-live="polite">{announcement}</p>
      </div>
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
          <p className="text-[max(12px,3.2cqw)] text-muted-foreground">
            {frTypo("51 patients · 130 variables")}
          </p>
        </div>
      </div>
      <div className="mt-[6cqw] h-[1.6cqw] w-[88%] overflow-hidden rounded-full bg-foreground/10">
        <div className="ev-fill h-full w-full bg-brand" style={delay(1.3)} />
      </div>
      <p
        className="ev-fade-up mt-[4cqw] font-hand text-[max(18px,5.4cqw)] leading-none text-brand"
        style={delay(2.6)}
      >
        fichier reçu ✓
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
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b-2 border-foreground text-left">
            <th className="w-[28%] py-[1.4cqw] font-semibold">id</th>
            <th className="w-[24%] py-[1.4cqw] font-semibold">âge</th>
            <th className="w-[20%] py-[1.4cqw] font-semibold">sexe</th>
            <th className="py-[1.4cqw] font-semibold">SAPS II</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => {
            const flag = "flag" in r ? r.flag : undefined;
            // Doublon : un trait par cellule, enchaînés pour barrer toute la ligne.
            const strike = (cell: number) =>
              flag === "dup" && (
                <span
                  className="ev-strike absolute inset-x-0 top-1/2 h-[2px] bg-brand"
                  style={delay(3.4 + cell * 0.1)}
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
                  <span className="relative inline-block">
                    {r.age}
                    {flag === "age" && (
                      <span
                        className="ev-circle absolute -inset-x-[1.8cqw] -inset-y-[1cqw] rounded-[50%] border-2 border-brand"
                        style={delay(2.4)}
                      />
                    )}
                  </span>
                  {strike(1)}
                </td>
                <td className="relative py-[1.6cqw]">
                  {r.sexe}
                  {strike(2)}
                </td>
                <td className="relative py-[1.6cqw]">
                  {r.saps ||
                    (flag === "missing" ? (
                      <span
                        className="ev-fade-up rounded-sm bg-highlight px-[1.4cqw] font-semibold"
                        style={delay(2.9)}
                      >
                        vide
                      </span>
                    ) : (
                      <span className="text-muted-foreground">vide</span>
                    ))}
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
        className="ev-fade-up mt-[3cqw] font-hand text-[max(17px,5cqw)] leading-tight text-brand"
        style={delay(4)}
      >
        âge extrême · manquant · doublon
      </p>
    </div>
  );
}

function ScoreScene() {
  const running = useContext(RunningContext);
  const runningRef = useRef(running);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  const [n, setN] = useState(0);

  // Compteur 0 → 64, qui s'arrête lui aussi quand la vidéo est en pause.
  useEffect(() => {
    if (prefersReducedMotion()) {
      setN(64);
      return;
    }
    let raf = 0;
    let elapsed = -300;
    let last = performance.now();
    const tick = (t: number) => {
      if (runningRef.current) elapsed += t - last;
      last = t;
      const p = Math.min(1, Math.max(0, elapsed / 1200));
      setN(Math.round(64 * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Ce que le test gratuit montre : les anomalies, pas encore le plan de correction.
  const findings = [
    ["Âge à vérifier", "212 ans"],
    ["Patient en double", "P-015"],
    ["SAPS II manquant", "12 %"],
  ].map(([label, value]) => [label, frTypo(value)] as const);

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
        {findings.map(([label, value], i) => (
          <li
            key={label}
            className="ev-fade-up flex items-center gap-[2.5cqw]"
            style={delay(1.7 + i * 0.45)}
          >
            <span className="inline-flex h-[5cqw] w-[5cqw] shrink-0 items-center justify-center rounded-sm border-2 border-brand font-bold leading-none text-brand">
              !
            </span>
            <span className="flex-1">{label}</span>
            <span className="font-semibold tabular-nums">{value}</span>
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
            className={cn(
              "ev-grow flex-1 rounded-t-[2px]",
              i === 1 ? "bg-brand" : "bg-foreground/35",
            )}
            style={{ ...delay(1.4 + i * 0.18), height: `${h}%` }}
          />
        ))}
      </div>
      <p
        className="ev-fade-up mt-[1.5cqw] text-[max(11px,3cqw)] italic text-muted-foreground"
        style={delay(2.2)}
      >
        Figure 2 — Évolution du score SAPS II
      </p>
      <span
        className="ev-stamp absolute right-[4cqw] top-[5cqw] rounded-sm border-2 border-brand bg-background px-[2cqw] py-[0.6cqw] font-hand text-[max(14px,4.6cqw)] leading-none text-brand"
        style={delay(3.4, { "--ev-rot": "-7deg" })}
      >
        relu · médecin
      </span>
      <span
        className="ev-stamp absolute right-[6cqw] top-[26cqw] rounded-sm border-2 border-brand bg-background px-[2cqw] py-[0.6cqw] font-hand text-[max(14px,4.6cqw)] leading-none text-brand"
        style={delay(4.1, { "--ev-rot": "5deg" })}
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
        Les statistiques et la rédaction de votre thèse, faites avec vous et relues par un médecin
        et un biostatisticien.
      </p>
      <p
        className="ev-fade-up mt-[6cqw] font-hand text-[max(20px,6cqw)] leading-tight text-brand"
        style={delay(1)}
      >
        <span className="mark">commencez par tester votre base</span>
        <br />
        c'est gratuit
      </p>
    </div>
  );
}
