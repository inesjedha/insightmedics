import { Badge, ScrollSvg, Txt } from "@/components/guides/figures/chart";

/**
 * Anatomie d'un tableau de résultats aux normes, sur le Tableau IV fictif du guide « Présenter
 * les résultats » : pastilles numérotées dans le tableau, explications dans la liste dessous.
 * Comme les tableaux des guides, il défile horizontalement sur téléphone.
 */

const ROWS: { v: string; a: string; b: string; p: string; sig?: boolean }[] = [
  { v: "Âge, ans", a: "61,2 ± 11,8", b: "55,9 ± 13,1", p: "0,033", sig: true },
  { v: "Sexe masculin", a: "26 (65,0)", b: "42 (52,5)", p: "0,193" },
  { v: "Diabète", a: "18 (45,0)", b: "14 (17,5)", p: "0,001", sig: true },
  { v: "Hypertension artérielle", a: "15 (37,5)", b: "24 (30,0)", p: "0,408" },
  { v: "Durée opératoire, min", a: "93 [67–118]", b: "73 [60–93]", p: "0,005", sig: true },
];

const LEGEND = [
  "Titre au-dessus du tableau, numéro en chiffres romains, effectif total.",
  "Effectif de chaque groupe dans l'en-tête de sa colonne.",
  "Unité dans la première colonne, pas dans les cellules.",
  "Une seule ligne pour une variable binaire : pas de ligne « Pas de diabète ».",
  "p exact, trois décimales ; p < 0,05 en gras, sans couleur ni étoile.",
  "Format des valeurs et tests utilisés, en note sous le tableau.",
];

export function TableAnatomy() {
  const W = 560;
  const g = 30;
  const cA = 206;
  const cB = 326;
  const cP = 478;
  const top = 50;
  const head = top + 46;
  const rowH = 26;
  const bottom = head + ROWS.length * rowH + 10;
  const H = bottom + 64;
  return (
    <div>
      <ScrollSvg
        w={W}
        h={H}
        maxWidth={600}
        label="Tableau IV fictif aux normes : Caractéristiques des patients selon la survenue d'une complication postopératoire (N = 120). Complication (n = 40) contre pas de complication (n = 80) : âge 61,2 ± 11,8 contre 55,9 ± 13,1 ans, p = 0,033 ; sexe masculin 26 (65,0) contre 42 (52,5), p = 0,193 ; diabète 18 (45,0) contre 14 (17,5), p = 0,001 ; hypertension artérielle 15 (37,5) contre 24 (30,0), p = 0,408 ; durée opératoire 93 [67–118] contre 73 [60–93] min, p = 0,005. Six pastilles numérotées renvoient aux règles de présentation."
      >
        <text x={g} y={18} className="fill-foreground font-semibold">
          <tspan x={g}>Tableau IV : Caractéristiques des patients selon la survenue</tspan>
          <tspan x={g} dy={17}>
            d'une complication postopératoire (N = 120)
          </tspan>
        </text>
        <Badge x={12} y={22} n={1} />

        <line x1={g} x2={W} y1={top} y2={top} strokeWidth={1.5} className="stroke-foreground" />
        <Txt x={g + 8} y={top + 28} bold>
          Variable
        </Txt>
        {[
          [cA, cB, "Complication", "(n = 40)"],
          [cB, cP, "Pas de complication", "(n = 80)"],
        ].map(([x0, x1, a, b]) => (
          <g key={String(a)}>
            <Txt x={(Number(x0) + Number(x1)) / 2} y={top + 20} anchor="middle" bold>
              {String(a)}
            </Txt>
            <Txt x={(Number(x0) + Number(x1)) / 2} y={top + 37} anchor="middle" bold>
              {String(b)}
            </Txt>
          </g>
        ))}
        <Badge x={cB - 14} y={top + 32} n={2} />
        <Txt x={cP + 12} y={top + 28} bold italic>
          p
        </Txt>
        <line x1={g} x2={W} y1={head} y2={head} strokeWidth={2} className="stroke-foreground" />

        {ROWS.map((r, i) => {
          const y = head + 18 + i * rowH;
          return (
            <g key={r.v}>
              {i > 0 && <line x1={g} x2={W} y1={y - 18} y2={y - 18} className="stroke-border" />}
              <Txt x={g + 8} y={y}>
                {r.v}
              </Txt>
              <Txt x={(cA + cB) / 2} y={y} anchor="middle">
                {r.a}
              </Txt>
              <Txt x={(cB + cP) / 2} y={y} anchor="middle">
                {r.b}
              </Txt>
              <Txt x={cP + 12} y={y} bold={r.sig}>
                {r.p}
              </Txt>
            </g>
          );
        })}
        <Badge x={g + 8 + 74} y={head + 13} n={3} />
        <Badge x={g + 8 + 62} y={head + 13 + 2 * rowH} n={4} />
        <Badge x={cP + 64} y={head + 13 + 2 * rowH} n={5} />
        <line
          x1={g}
          x2={W}
          y1={bottom}
          y2={bottom}
          strokeWidth={1.5}
          className="stroke-foreground"
        />

        <text x={g} y={bottom + 20} fontSize={12} className="fill-muted-foreground italic">
          <tspan x={g}>
            Note : valeurs exprimées en effectif (pourcentage), moyenne ± écart-type ou médiane
          </tspan>
          <tspan x={g} dy={16}>
            [Q1–Q3]. Tests : t de Student (âge), Chi² de Pearson (sexe, diabète, hypertension
          </tspan>
          <tspan x={g} dy={16}>
            artérielle), U de Mann-Whitney (durée opératoire).
          </tspan>
        </text>
        <Badge x={12} y={bottom + 31} n={6} />
      </ScrollSvg>
      <ol className="mt-4 grid gap-x-6 gap-y-2 text-[14px] leading-snug sm:grid-cols-2">
        {LEGEND.map((l, i) => (
          <li key={l} className="flex gap-2.5">
            <span
              aria-hidden
              className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-brand-foreground"
            >
              {i + 1}
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
