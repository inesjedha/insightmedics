import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Lines, Responsive, Svg, Txt } from "@/components/guides/figures/chart";
import { NARROW, small } from "@/components/guides/figures/scale";

/**
 * Tableaux 2 × 2 illustrés : le tableau de contingence d'un test diagnostique (avec la lecture
 * de Se, Sp, VPP, VPN) et le calcul des effectifs théoriques qui fait choisir Chi² ou Fisher.
 */

type Cell = {
  main: string;
  sub: string;
  /** Case mise en avant (fond bleu pâle, contour bleu). */
  strong?: boolean;
  title: string;
};

type GridGeom = { gx: number; cw: number; ch: number; gy: number; gap: number };

/** En-têtes de colonnes, en-têtes de lignes et quatre cases. */
function Grid({
  g,
  narrow,
  cols,
  rows,
  cells,
}: {
  g: GridGeom;
  narrow: boolean;
  cols: [string, string][];
  rows: [string, string][];
  cells: Cell[][];
}) {
  const cx = (j: number) => g.gx + j * (g.cw + g.gap);
  const cy = (i: number) => g.gy + i * (g.ch + g.gap);
  return (
    <g>
      {cols.map(([a, b], j) => (
        <Lines
          key={a}
          x={cx(j) + g.cw / 2}
          y={g.gy - 26}
          anchor="middle"
          lines={[a, b]}
          lh={16}
          bold
          size={narrow ? 12.5 : undefined}
        />
      ))}
      {rows.map(([a, b], i) => (
        <g key={a}>
          <Txt
            x={g.gx - 10}
            y={cy(i) + g.ch / 2 - 3}
            anchor="end"
            bold
            size={narrow ? 12.5 : undefined}
          >
            {a}
          </Txt>
          <Txt
            x={g.gx - 10}
            y={cy(i) + g.ch / 2 + 14}
            anchor="end"
            tone="muted"
            size={narrow ? 12.5 : undefined}
          >
            {b}
          </Txt>
        </g>
      ))}
      {cells.map((r, i) =>
        r.map((c, j) => (
          <g key={`${i}${j}`}>
            <title>{c.title}</title>
            <rect
              x={cx(j)}
              y={cy(i)}
              width={g.cw}
              height={g.ch}
              rx={6}
              strokeWidth={c.strong ? 2 : 1}
              className={cn(c.strong ? "fill-accent stroke-brand" : "fill-surface stroke-border")}
            />
            <Txt x={cx(j) + g.cw / 2} y={cy(i) + g.ch / 2 + 2} anchor="middle" bold size={24}>
              {c.main}
            </Txt>
            <Txt
              x={cx(j) + g.cw / 2}
              y={cy(i) + g.ch / 2 + 21}
              anchor="middle"
              tone="muted"
              size={small(narrow)}
            >
              {c.sub}
            </Txt>
          </g>
        )),
      )}
    </g>
  );
}

/** Accolade simple sous une colonne (horizontale) ou à droite d'une ligne (verticale). */
function Bracket({
  x1,
  x2,
  y,
  vertical,
}: {
  x1: number;
  x2: number;
  y: number;
  vertical?: boolean;
}) {
  const d = vertical
    ? `M${y - 6},${x1}H${y}V${x2}H${y - 6}`
    : `M${x1},${y - 6}V${y}H${x2}V${y - 6}`;
  return (
    <path d={d} fill="none" strokeWidth={1.5} className="stroke-brand" strokeLinejoin="round" />
  );
}

function Metric({
  x,
  y,
  name,
  value,
  anchor = "middle",
}: {
  x: number;
  y: number;
  name: ReactNode;
  value: ReactNode;
  anchor?: "start" | "middle";
}) {
  return (
    <g>
      <Txt x={x} y={y} anchor={anchor} bold>
        {name}
      </Txt>
      <Txt x={x} y={y + 17} anchor={anchor} tone="muted">
        {value}
      </Txt>
    </g>
  );
}

/** Tableau 2 × 2 de la CRP au seuil de 30 mg/L : 51 VP, 22 FP, 9 FN, 68 VN. */
export function ConfusionMatrix() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const g: GridGeom = narrow
          ? { gx: 96, cw: 115, ch: 70, gy: 44, gap: 4 }
          : { gx: 150, cw: 150, ch: 72, gy: 44, gap: 4 };
        const colX = (j: number) => g.gx + j * (g.cw + g.gap);
        const rowY = (i: number) => g.gy + i * (g.ch + g.gap);
        const gridBottom = rowY(2) - g.gap;
        const by = gridBottom + 14;
        const h = narrow ? by + 98 : by + 44;
        const rbx = colX(2) + 8;
        return (
          <Svg
            w={w}
            h={h}
            label="Tableau 2 × 2 de la CRP au seuil de 30 mg/L chez 150 enfants. Parmi 60 appendicites : 51 vrais positifs et 9 faux négatifs. Parmi 90 enfants sans appendicite : 22 faux positifs et 68 vrais négatifs. Sensibilité 51/60 = 85,0 % ; spécificité 68/90 = 75,6 % ; VPP 51/73 = 69,9 % ; VPN 68/77 = 88,3 %."
          >
            <Grid
              g={g}
              narrow={narrow}
              cols={[
                ["Appendicite", "(n = 60)"],
                ["Pas d'appendicite", "(n = 90)"],
              ]}
              rows={[
                [narrow ? "CRP ≥ 30" : "CRP ≥ 30 mg/L", "n = 73"],
                [narrow ? "CRP < 30" : "CRP < 30 mg/L", "n = 77"],
              ]}
              cells={[
                [
                  { main: "51", sub: "vrais positifs", strong: true, title: "Vrais positifs : 51" },
                  { main: "22", sub: "faux positifs", title: "Faux positifs : 22" },
                ],
                [
                  { main: "9", sub: "faux négatifs", title: "Faux négatifs : 9" },
                  { main: "68", sub: "vrais négatifs", strong: true, title: "Vrais négatifs : 68" },
                ],
              ]}
            />
            {/* Lecture par colonne : Se et Sp */}
            <Bracket x1={colX(0) + 10} x2={colX(0) + g.cw - 10} y={by} />
            <Bracket x1={colX(1) + 10} x2={colX(1) + g.cw - 10} y={by} />
            <Metric
              x={colX(0) + g.cw / 2}
              y={by + 20}
              name="Sensibilité"
              value="51 / 60 = 85,0 %"
            />
            <Metric
              x={colX(1) + g.cw / 2}
              y={by + 20}
              name="Spécificité"
              value="68 / 90 = 75,6 %"
            />
            {/* Lecture par ligne : VPP et VPN */}
            {narrow ? (
              <>
                <Txt x={0} y={by + 74}>
                  <tspan className="font-semibold">VPP</tspan> (ligne CRP ≥ 30) = 51 / 73 = 69,9 %
                </Txt>
                <Txt x={0} y={by + 94}>
                  <tspan className="font-semibold">VPN</tspan> (ligne CRP &lt; 30) = 68 / 77 = 88,3
                  %
                </Txt>
              </>
            ) : (
              <>
                <Bracket x1={rowY(0) + 10} x2={rowY(0) + g.ch - 10} y={rbx} vertical />
                <Bracket x1={rowY(1) + 10} x2={rowY(1) + g.ch - 10} y={rbx} vertical />
                <Metric
                  x={rbx + 12}
                  y={rowY(0) + g.ch / 2 - 4}
                  name="VPP"
                  value="51 / 73 = 69,9 %"
                  anchor="start"
                />
                <Metric
                  x={rbx + 12}
                  y={rowY(1) + g.ch / 2 - 4}
                  name="VPN"
                  value="68 / 77 = 88,3 %"
                  anchor="start"
                />
              </>
            )}
          </Svg>
        );
      }}
    />
  );
}

/** Effectifs théoriques : 70 patients (40 en A, 30 en B), 8 complications au total. */
export function ExpectedCounts() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const g: GridGeom = narrow
          ? { gx: 96, cw: 115, ch: 70, gy: 44, gap: 4 }
          : { gx: 150, cw: 150, ch: 72, gy: 44, gap: 4 };
        const gridBottom = g.gy + 2 * (g.ch + g.gap) - g.gap;
        const ty = gridBottom + 30;
        const h = ty + (narrow ? 46 : 28);
        const cell = (n: string, f: string, strong: boolean, t: string): Cell => ({
          main: n,
          sub: f,
          strong,
          title: t,
        });
        return (
          <Svg
            w={w}
            h={h}
            label="Effectifs théoriques d'un tableau 2 × 2 : 70 patients, 40 dans le groupe A et 30 dans le groupe B, 8 complications au total. Complications attendues : 40 × 8 / 70 = 4,6 dans le groupe A et 30 × 8 / 70 = 3,4 dans le groupe B, toutes deux inférieures à 5 : le test exact de Fisher s'impose."
          >
            <Grid
              g={g}
              narrow={narrow}
              cols={[
                ["Complication", "(total 8)"],
                [narrow ? "Sans complication" : "Pas de complication", "(total 62)"],
              ]}
              rows={[
                ["Groupe A", "n = 40"],
                ["Groupe B", "n = 30"],
              ]}
              cells={[
                [
                  cell("4,6", "40 × 8 / 70", true, "Groupe A, complication : 40 × 8 / 70 = 4,57"),
                  cell(
                    "35,4",
                    "40 × 62 / 70",
                    false,
                    "Groupe A, pas de complication : 40 × 62 / 70 = 35,43",
                  ),
                ],
                [
                  cell("3,4", "30 × 8 / 70", true, "Groupe B, complication : 30 × 8 / 70 = 3,43"),
                  cell(
                    "26,6",
                    "30 × 62 / 70",
                    false,
                    "Groupe B, pas de complication : 30 × 62 / 70 = 26,57",
                  ),
                ],
              ]}
            />
            {narrow ? (
              <Lines
                x={0}
                y={ty}
                lh={18}
                lines={[
                  <tspan key="a">Effectif théorique = total de la ligne</tspan>,
                  "× total de la colonne / effectif total.",
                  <tspan key="c" className="font-semibold">
                    Deux cases &lt; 5 : test exact de Fisher.
                  </tspan>,
                ]}
              />
            ) : (
              <Lines
                x={0}
                y={ty}
                lh={18}
                lines={[
                  "Effectif théorique = total de la ligne × total de la colonne / effectif total (70).",
                  <tspan key="c" className="font-semibold">
                    Deux cases sont inférieures à 5 : le test exact de Fisher s'impose.
                  </tspan>,
                ]}
              />
            )}
          </Svg>
        );
      }}
    />
  );
}
