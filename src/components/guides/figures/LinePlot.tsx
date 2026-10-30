import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dot, LegendItem, Svg, Txt } from "@/components/guides/figures/chart";
import { COMPARE_FILL, COMPARE_STROKE, lin } from "@/components/guides/figures/scale";

/**
 * Courbe(s) sur deux axes linéaires : grille en filets, axes discrets, une ou deux séries
 * (bleu de la marque, gris de comparaison), points annotés avec info-bulle, lignes de référence.
 * Sert de base aux courbes de puissance, de précision et de valeurs prédictives.
 */

export type Tone = "brand" | "compare";

export type Axis = {
  min: number;
  max: number;
  ticks: number[];
  format: (v: number) => string;
  title: string;
};

export type Series = {
  id: string;
  label: string;
  points: [number, number][];
  tone?: Tone;
  /** Voile de 10 % sous la courbe. */
  area?: boolean;
};

export type Mark = {
  x: number;
  y: number;
  /** Lignes du libellé : la première en encre (gras si `bold`), les suivantes en gris. */
  label?: string[];
  dx?: number;
  dy?: number;
  anchor?: "start" | "middle" | "end";
  tone?: Tone;
  bold?: boolean;
  /** Trait de rappel entre le point et son libellé, quand le libellé est éloigné. */
  leader?: boolean;
  title: string;
};

export type Ref = { v: number; label?: string; labelAnchor?: "start" | "end" };

export type Scales = { sx: (v: number) => number; sy: (v: number) => number };

const lineCls = (t: Tone = "brand") => (t === "brand" ? "stroke-brand" : COMPARE_STROKE);
const dotCls = (t: Tone = "brand") => (t === "brand" ? "fill-brand" : COMPARE_FILL);

export function LinePlot({
  w,
  plotH,
  x,
  y,
  series,
  marks = [],
  refY = [],
  refX = [],
  label,
  ml = 46,
  mr = 18,
  legend,
  extra,
}: {
  w: number;
  plotH: number;
  x: Axis;
  y: Axis;
  series: Series[];
  marks?: Mark[];
  refY?: Ref[];
  refX?: Ref[];
  label: string;
  ml?: number;
  mr?: number;
  /** Légende sous le graphique (obligatoire dès deux séries) ; une ligne par entrée. */
  legend?: boolean;
  extra?: (s: Scales) => ReactNode;
}) {
  const top = 30;
  const x0 = ml;
  const x1 = w - mr;
  const y0 = top;
  const y1 = top + plotH;
  const sx = lin(x.min, x.max, x0, x1);
  const sy = lin(y.min, y.max, y1, y0);
  const legendRows = legend ? series.length : 0;
  const h = y1 + 50 + legendRows * 22 + (legend ? 6 : 0);
  const path = (pts: [number, number][]) =>
    pts.map(([a, b], i) => `${i ? "L" : "M"}${sx(a).toFixed(1)},${sy(b).toFixed(1)}`).join("");

  return (
    <Svg w={w} h={h} label={label}>
      {/* Titre de l'axe vertical, à l'horizontale au-dessus de l'axe */}
      <Txt x={0} y={14} tone="muted">
        {y.title}
      </Txt>

      {/* Grille et graduations verticales */}
      {y.ticks.map((t) => (
        <g key={`y${t}`}>
          <line
            x1={x0}
            x2={x1}
            y1={sy(t)}
            y2={sy(t)}
            strokeWidth={1}
            className={t === y.min ? "stroke-foreground/35" : "stroke-border"}
          />
          <Txt x={x0 - 8} y={sy(t) + 4.5} anchor="end" tone="muted">
            {y.format(t)}
          </Txt>
        </g>
      ))}
      {/* Graduations horizontales */}
      {x.ticks.map((t) => (
        <g key={`x${t}`}>
          <line x1={sx(t)} x2={sx(t)} y1={y1} y2={y1 + 5} className="stroke-foreground/35" />
          <Txt x={sx(t)} y={y1 + 20} anchor="middle" tone="muted">
            {x.format(t)}
          </Txt>
        </g>
      ))}
      <Txt x={(x0 + x1) / 2} y={y1 + 40} anchor="middle" tone="muted">
        {x.title}
      </Txt>

      {/* Lignes de référence (seuils) */}
      {refY.map((r) => (
        <g key={`ry${r.v}`}>
          <line
            x1={x0}
            x2={x1}
            y1={sy(r.v)}
            y2={sy(r.v)}
            strokeWidth={1.25}
            strokeDasharray="5 4"
            className="stroke-muted-foreground"
          />
          {r.label && (
            <Txt
              x={r.labelAnchor === "start" ? x0 + 6 : x1}
              y={sy(r.v) - 6}
              anchor={r.labelAnchor ?? "end"}
              tone="muted"
            >
              {r.label}
            </Txt>
          )}
        </g>
      ))}
      {refX.map((r) => (
        <g key={`rx${r.v}`}>
          <line
            x1={sx(r.v)}
            x2={sx(r.v)}
            y1={y0}
            y2={y1}
            strokeWidth={1}
            className="stroke-border"
          />
        </g>
      ))}

      {/* Séries */}
      {series.map((s) => (
        <g key={s.id}>
          {s.area && (
            <path
              d={`${path(s.points)}L${sx(s.points[s.points.length - 1][0])},${y1}L${sx(
                s.points[0][0],
              )},${y1}Z`}
              className="fill-brand opacity-10"
            />
          )}
          <path
            d={path(s.points)}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={lineCls(s.tone)}
          />
        </g>
      ))}

      {extra?.({ sx, sy })}

      {/* Points annotés */}
      {marks.map((m) => (
        <g key={`${m.x}-${m.y}-${m.title}`}>
          {m.leader && (
            <line
              x1={sx(m.x)}
              y1={sy(m.y)}
              x2={sx(m.x) + (m.dx ?? 10) - 4}
              y2={sy(m.y) + (m.dy ?? -10) + 4}
              strokeWidth={1}
              className="stroke-muted-foreground"
            />
          )}
          <Dot cx={sx(m.x)} cy={sy(m.y)} className={dotCls(m.tone)} title={m.title} />
          {m.label && (
            <text
              x={sx(m.x) + (m.dx ?? 10)}
              y={sy(m.y) + (m.dy ?? -10)}
              textAnchor={m.anchor ?? "start"}
            >
              {m.label.map((l, i) => (
                <tspan
                  key={i}
                  x={sx(m.x) + (m.dx ?? 10)}
                  dy={i === 0 ? 0 : 16}
                  className={cn(
                    i === 0 ? "fill-foreground" : "fill-muted-foreground",
                    i === 0 && m.bold && "font-semibold",
                  )}
                >
                  {l}
                </tspan>
              ))}
            </text>
          )}
        </g>
      ))}

      {legend &&
        series.map((s, i) => (
          <LegendItem
            key={s.id}
            x={0}
            y={y1 + 70 + i * 22}
            label={s.label}
            className={lineCls(s.tone)}
          />
        ))}
    </Svg>
  );
}
