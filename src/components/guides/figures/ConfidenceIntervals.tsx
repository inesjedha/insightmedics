import { cn } from "@/lib/utils";
import { Responsive, Svg, Txt } from "@/components/guides/figures/chart";
import {
  COMPARE_FILL,
  COMPARE_STROKE,
  NARROW,
  fr,
  lin,
  logScale,
  small,
} from "@/components/guides/figures/scale";

/**
 * Intervalles de confiance sur un axe commun (type forest plot), avec la valeur de non-effet
 * (0 pour une différence, 1 pour un odds ratio) en trait plein : un intervalle qui la traverse
 * n'est pas significatif au seuil de 5 %.
 */

type Row = {
  name: string;
  detail: string;
  /** Troisième ligne facultative : la lecture. */
  reading?: string;
  lo: number;
  hi: number;
  est?: number;
  muted?: boolean;
  title: string;
  /** Intertitre affiché avant la ligne. */
  group?: string;
};

function IntervalPlot({
  w,
  rows,
  log,
  min,
  max,
  ticks,
  ref,
  axisTitle,
  left,
  right,
  label,
}: {
  w: number;
  rows: Row[];
  log?: boolean;
  min: number;
  max: number;
  ticks: number[];
  ref: number;
  axisTitle: string;
  left: string;
  right: string;
  label: string;
}) {
  const narrow = w === NARROW;
  const px0 = narrow ? 14 : 236;
  const px1 = w - 16;
  const sx = (log ? logScale : lin)(min, max, px0, px1);
  const top = 34;
  // Hauteur de chaque ligne : sur téléphone, le libellé passe au-dessus de l'intervalle.
  const textLines = (r: Row) => (r.reading ? 3 : 2);
  const rowH = (r: Row) => (narrow ? 16 * textLines(r) + 30 : Math.max(58, 16 * textLines(r) + 22));
  const groupH = 30;
  let y = top;
  const placed = rows.map((r) => {
    if (r.group) y += groupH;
    const y0 = y;
    y += rowH(r);
    return { r, y0 };
  });
  const yEnd = y + 6;
  const h = yEnd + 52;

  return (
    <Svg w={w} h={h} label={label}>
      {/* Sens de lecture au-dessus de l'axe */}
      <Txt x={sx(ref) - 8} y={16} anchor="end" tone="muted">
        {`← ${left}`}
      </Txt>
      <Txt x={sx(ref) + 8} y={16} tone="muted">
        {`${right} →`}
      </Txt>

      {/* Grille verticale et graduations */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={top - 6} y2={yEnd} className="stroke-border" />
          <Txt x={sx(t)} y={yEnd + 20} anchor="middle" tone="muted">
            {fr(t, Number.isInteger(t) ? 0 : 1)}
          </Txt>
        </g>
      ))}
      <line x1={px0} x2={px1} y1={yEnd} y2={yEnd} className="stroke-foreground/35" />
      <line
        x1={sx(ref)}
        x2={sx(ref)}
        y1={top - 6}
        y2={yEnd}
        strokeWidth={1.5}
        className="stroke-foreground"
      />
      <Txt x={(px0 + px1) / 2} y={yEnd + 40} anchor="middle" tone="muted">
        {axisTitle}
      </Txt>

      {placed.map(({ r, y0 }) => {
        const lines = [r.name, r.detail, ...(r.reading ? [r.reading] : [])];
        const ly = narrow ? y0 + 14 : y0 + 16;
        const iy = narrow ? y0 + 16 * lines.length + 12 : y0 + rowH(r) / 2 - 4;
        const cls = r.muted ? COMPARE_STROKE : "stroke-brand";
        const lo = Math.max(r.lo, min);
        const hi = Math.min(r.hi, max);
        return (
          <g key={r.name}>
            {r.group && (
              <rect
                x={0}
                y={y0 - 24}
                width={r.group.length * 9 + 6}
                height={18}
                className="fill-card"
              />
            )}
            {r.group && (
              <Txt
                x={0}
                y={y0 - 10}
                tone="muted"
                size={small(narrow)}
                className="uppercase tracking-[0.08em]"
              >
                {r.group}
              </Txt>
            )}
            <title>{r.title}</title>
            {/* Fond sous le libellé : la grille ne traverse pas le texte */}
            <rect
              x={0}
              y={ly - 13}
              width={Math.max(...lines.map((l) => l.length)) * 7 + 6}
              height={lines.length * 16 + 2}
              className="fill-card"
            />
            <text x={0} y={ly}>
              {lines.map((l, i) => (
                <tspan
                  key={i}
                  x={0}
                  dy={i === 0 ? 0 : 16}
                  className={cn(
                    i === 0 ? "fill-foreground font-semibold" : "fill-muted-foreground",
                  )}
                >
                  {l}
                </tspan>
              ))}
            </text>
            {/* Zone de survol plus grande que la marque */}
            <rect x={px0} y={iy - 12} width={px1 - px0} height={24} className="fill-transparent" />
            <line
              x1={sx(lo)}
              x2={sx(hi)}
              y1={iy}
              y2={iy}
              strokeWidth={2.5}
              strokeLinecap="round"
              className={cls}
            />
            <line
              x1={sx(lo)}
              x2={sx(lo)}
              y1={iy - 7}
              y2={iy + 7}
              strokeWidth={2}
              strokeLinecap="round"
              className={cls}
            />
            <line
              x1={sx(hi)}
              x2={sx(hi)}
              y1={iy - 7}
              y2={iy + 7}
              strokeWidth={2}
              strokeLinecap="round"
              className={cls}
            />
            {r.est !== undefined && (
              <rect
                x={sx(r.est) - 6}
                y={iy - 6}
                width={12}
                height={12}
                rx={2}
                strokeWidth={2}
                className={cn("stroke-card", r.muted ? COMPARE_FILL : "fill-brand")}
              />
            )}
          </g>
        );
      })}
    </Svg>
  );
}

/** Pansements A et B : même différence de 15 points avec 60 puis 240 patients par groupe. */
export function CiBySampleSize() {
  return (
    <Responsive
      render={(w) => (
        <IntervalPlot
          w={w}
          label="Différence de taux de cicatrisation entre les pansements A et B, 15,0 points, avec son intervalle de confiance à 95 %. Avec 60 patients par groupe : de −1,5 à 31,5 points, l'intervalle contient 0, p = 0,079. Avec 240 patients par groupe : de 6,7 à 23,3 points, l'intervalle exclut 0, p < 0,001."
          min={-15}
          max={40}
          ticks={[-10, 0, 10, 20, 30, 40]}
          ref={0}
          left="B meilleur"
          right="A meilleur"
          axisTitle="Différence de cicatrisation A − B (points)"
          rows={[
            {
              name: "60 patients par groupe",
              detail: "15,0 [−1,5 ; 31,5] · p = 0,079",
              reading: "L'IC contient 0 : non significatif",
              est: 15,
              lo: -1.5,
              hi: 31.5,
              muted: true,
              title: "60 par groupe : différence 15,0 points, IC 95 % −1,5 à 31,5, p = 0,079",
            },
            {
              name: "240 patients par groupe",
              detail: "15,0 [6,7 ; 23,3] · p < 0,001",
              reading: "L'IC exclut 0 : significatif",
              est: 15,
              lo: 6.7,
              hi: 23.3,
              title: "240 par groupe : différence 15,0 points, IC 95 % 6,7 à 23,3, p < 0,001",
            },
          ]}
        />
      )}
    />
  );
}

/** Odds ratios ajustés de l'exemple du guide, puis deux intervalles types, sur échelle log. */
export function OddsRatioForest() {
  return (
    <Responsive
      render={(w) => (
        <IntervalPlot
          w={w}
          log
          label="Odds ratios et intervalles de confiance à 95 % sur une échelle logarithmique, avec une ligne verticale à 1. Score SAPS II supérieur à 40 : OR ajusté 3,4, IC 2,2 à 5,1. Ventilation mécanique : OR ajusté 2,1, IC 1,3 à 3,4. Un intervalle de 0,8 à 2,9 contient 1 : non concluant. Un intervalle de 1,1 à 25 exclut 1 mais est très imprécis."
          min={0.3}
          max={30}
          ticks={[0.5, 1, 2, 5, 10, 25]}
          ref={1}
          left="plus faible"
          right="plus élevée"
          axisTitle="Odds ratio : cote de l'événement (échelle log)"
          rows={[
            {
              group: "Exemple du guide",
              name: "SAPS II > 40",
              detail: "ORa 3,4 [2,2 – 5,1] · p < 0,001",
              est: 3.4,
              lo: 2.2,
              hi: 5.1,
              title: "SAPS II > 40 : OR ajusté 3,4, IC 95 % 2,2 à 5,1, p < 0,001",
            },
            {
              name: "Ventilation mécanique",
              detail: "ORa 2,1 [1,3 – 3,4] · p = 0,003",
              est: 2.1,
              lo: 1.3,
              hi: 3.4,
              title: "Ventilation mécanique : OR ajusté 2,1, IC 95 % 1,3 à 3,4, p = 0,003",
            },
            {
              group: "Deux intervalles à savoir lire",
              name: "IC [0,8 – 2,9]",
              detail: "Contient 1 : ne permet pas de conclure",
              lo: 0.8,
              hi: 2.9,
              muted: true,
              title: "Intervalle de 0,8 à 2,9 : contient 1, non significatif",
            },
            {
              name: "IC [1,1 – 25]",
              detail: "Exclut 1, mais très imprécis",
              lo: 1.1,
              hi: 25,
              muted: true,
              title: "Intervalle de 1,1 à 25 : significatif mais très imprécis",
            },
          ]}
        />
      )}
    />
  );
}
