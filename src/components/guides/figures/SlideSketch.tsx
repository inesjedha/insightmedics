import { cn } from "@/lib/utils";
import { Responsive, Svg, Txt, Verdict } from "@/components/guides/figures/chart";
import { NARROW, hBarPath, lin, small } from "@/components/guides/figures/scale";

/**
 * Soutenance : une diapositive de résultats avant / après (exemple fictif du guide : diabète
 * chez 9 patients sur 20 avec récidive contre 5 sur 40 sans, p = 0,009, test exact de Fisher),
 * et la répartition du temps pour 15 minutes de présentation.
 */

function SlideFrame({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect
      x={x + 0.5}
      y={y + 0.5}
      width={w - 1}
      height={h - 1}
      rx={4}
      strokeWidth={1}
      className="fill-card stroke-foreground/45"
    />
  );
}

/** Diapositive « avant » : titre de rubrique et tableau de thèse recopié (lignes de texte figurées). */
function Before({ x, y, w }: { x: number; y: number; w: number }) {
  const h = Math.round((w * 9) / 16);
  const sx = x + 12;
  const tableTop = y + 38;
  const rows = 13;
  const rowH = (h - 50) / rows;
  const cols = [0.36, 0.16, 0.16, 0.14, 0.1];
  return (
    <g>
      <SlideFrame x={x} y={y} w={w} h={h} />
      <Txt x={sx} y={y + 24} bold size={14}>
        Résultats (3)
      </Txt>
      {Array.from({ length: rows }, (_, r) => {
        let cx = sx;
        const ry = tableTop + r * rowH;
        return (
          <g key={r}>
            {cols.map((c, ci) => {
              const cw = c * (w - 24);
              // Longueurs variées, mais fixes : du « texte » illisible, pas des données.
              const fill = 0.45 + (((r * 7 + ci * 3) % 5) / 5) * 0.45;
              const el = (
                <rect
                  key={ci}
                  x={cx + 2}
                  y={ry + rowH * 0.3}
                  width={Math.max(6, (cw - 8) * fill)}
                  height={Math.max(2.5, rowH * 0.36)}
                  rx={1}
                  className={cn(r === 0 ? "fill-foreground/55" : "fill-muted-foreground/40")}
                />
              );
              cx += cw;
              return el;
            })}
          </g>
        );
      })}
    </g>
  );
}

/** Diapositive « après » : titre-message, deux barres, le p et une mention discrète. */
function After({ x, y, w, narrow }: { x: number; y: number; w: number; narrow: boolean }) {
  const h = Math.round((w * 9) / 16);
  const sx = x + 12;
  const bx0 = sx;
  const bx1 = x + w - 70;
  const s = lin(0, 50, bx0, bx1);
  const bars = [
    { name: "Récidive (n = 20)", v: 45.0, lab: "45,0 % (9/20)" },
    { name: "Pas de récidive (n = 40)", v: 12.5, lab: "12,5 % (5/40)" },
  ];
  const fs = narrow ? 12.5 : 11.5;
  return (
    <g>
      <SlideFrame x={x} y={y} w={w} h={h} />
      <text x={sx} y={y + 22} className="fill-foreground font-semibold" fontSize={narrow ? 14 : 13}>
        <tspan x={sx}>Le diabète était plus fréquent</tspan>
        <tspan x={sx} dy={narrow ? 17 : 16}>
          en cas de récidive
        </tspan>
      </text>
      {bars.map((b, i) => {
        const by = y + (narrow ? 66 : 60) + i * (narrow ? 34 : 30);
        return (
          <g key={b.name}>
            <title>{`${b.name} : diabète ${b.lab}`}</title>
            <Txt x={sx} y={by} size={fs} tone="muted">
              {b.name}
            </Txt>
            <path
              d={hBarPath(bx0, s(b.v), by + 5, 11)}
              className={i === 0 ? "fill-brand" : "fill-muted-foreground/45"}
            />
            <Txt x={s(b.v) + 6} y={by + 14.5} size={fs} bold={i === 0}>
              {b.lab}
            </Txt>
          </g>
        );
      })}
      <Txt x={sx} y={y + h - (narrow ? 38 : 33)} size={fs} bold>
        p = 0,009 (test exact de Fisher)
      </Txt>
      <Txt x={sx} y={y + h - (narrow ? 14 : 12)} size={narrow ? 12.5 : 11.5} tone="muted">
        {narrow
          ? "Âge, sexe, tabagisme, HTA… : différence non significative"
          : "Âge, sexe, tabagisme, HTA… : non significatif"}
      </Txt>
    </g>
  );
}

export function SlideBeforeAfter() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const sw = narrow ? w : (w - 24) / 2;
        const sh = Math.round((sw * 9) / 16);
        const head = 26;
        const h = narrow ? 2 * (sh + head) + 18 : sh + head;
        return (
          <Svg
            w={w}
            h={h}
            label="Deux versions d'une diapositive de résultats. À éviter : un titre de rubrique, « Résultats (3) », et un tableau de thèse de treize lignes recopié en petits caractères. À préférer : un titre-message, « Le diabète était plus fréquent en cas de récidive », deux barres, 45,0 % (9 sur 20) avec récidive contre 12,5 % (5 sur 40) sans récidive, p = 0,009 au test exact de Fisher, et une mention discrète des variables non significatives."
          >
            <Verdict x={10} y={9} ok={false} />
            <Txt x={28} y={14} bold>
              Titre de rubrique, tableau recopié
            </Txt>
            <Before x={0} y={head} w={sw} />
            <g>
              <Verdict x={(narrow ? 0 : sw + 24) + 10} y={(narrow ? sh + head + 18 : 0) + 9} ok />
              <Txt x={(narrow ? 0 : sw + 24) + 28} y={(narrow ? sh + head + 18 : 0) + 14} bold>
                Titre-message, une seule ligne
              </Txt>
              <After
                x={narrow ? 0 : sw + 24}
                y={narrow ? sh + 2 * head + 18 : head}
                w={sw}
                narrow={narrow}
              />
            </g>
          </Svg>
        );
      }}
    />
  );
}

const PLAN = [
  { part: "Titre", s: 30, d: "30 s" },
  { part: "Contexte", s: 120, d: "2 min" },
  { part: "Objectifs", s: 30, d: "30 s" },
  { part: "Méthodes", s: 150, d: "2 min 30" },
  { part: "Résultats clés", s: 330, d: "5 min 30", key: true },
  { part: "Discussion", s: 150, d: "2 min 30", key: true },
  { part: "Conclusion", s: 60, d: "1 min" },
  { part: "Remerciements", s: 30, d: "30 s" },
];

/** Répartition des 15 minutes, partie par partie, sur une frise commune. */
export function TimePlan() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const lw = narrow ? 104 : 124;
        const x0 = lw;
        const x1 = w - (narrow ? 64 : 160);
        const sx = lin(0, 900, x0, x1);
        const top = 10;
        const rowH = 26;
        const bh = 14;
        const y1 = top + PLAN.length * rowH;
        const h = y1 + 44;
        let t = 0;
        const rows = PLAN.map((p) => {
          const r = { ...p, t0: t };
          t += p.s;
          return r;
        });
        const k0 = top + 4 * rowH;
        const k1 = top + 6 * rowH;
        return (
          <Svg
            w={w}
            h={h}
            label="Répartition d'une présentation de 15 minutes : titre 30 secondes, contexte 2 minutes, objectifs 30 secondes, méthodes 2 minutes 30, résultats clés 5 minutes 30, discussion 2 minutes 30, conclusion 1 minute, remerciements 30 secondes. Résultats et discussion occupent 8 minutes sur 15."
          >
            {[0, 5, 10, 15].map((m) => (
              <g key={m}>
                <line
                  x1={sx(m * 60)}
                  x2={sx(m * 60)}
                  y1={top - 6}
                  y2={y1}
                  className={m === 0 ? "stroke-foreground/35" : "stroke-border"}
                />
                <Txt x={sx(m * 60)} y={y1 + 18} anchor="middle" tone="muted">
                  {m === 15 ? "15 min" : String(m)}
                </Txt>
              </g>
            ))}
            <Txt x={(x0 + x1) / 2} y={y1 + 38} anchor="middle" tone="muted" size={small(narrow)}>
              Temps écoulé
            </Txt>
            {rows.map((r, i) => {
              const y = top + i * rowH;
              return (
                <g key={r.part}>
                  <title>{`${r.part} : ${r.d}`}</title>
                  <rect x={0} y={y} width={w} height={rowH} className="fill-transparent" />
                  <Txt x={0} y={y + 17} bold={r.key} size={narrow ? 12.5 : undefined}>
                    {r.part}
                  </Txt>
                  <path
                    d={hBarPath(sx(r.t0) + 1, sx(r.t0 + r.s) - 1, y + (rowH - bh) / 2, bh, 3)}
                    className={r.key ? "fill-brand" : "fill-muted-foreground/45"}
                  />
                  <rect
                    x={sx(r.t0 + r.s) + 3}
                    y={y + 5}
                    width={r.d.length * 7 + 6}
                    height={16}
                    className="fill-card"
                  />
                  <Txt
                    x={sx(r.t0 + r.s) + 6}
                    y={y + 17}
                    tone={r.key ? "ink" : "muted"}
                    bold={r.key}
                    size={small(narrow)}
                  >
                    {r.d}
                  </Txt>
                </g>
              );
            })}
            {!narrow && (
              <g>
                <path
                  d={`M${x1 + 34},${k0 + 4}h6V${k1 - 4}h-6`}
                  fill="none"
                  strokeWidth={1.5}
                  className="stroke-brand"
                />
                <Txt x={x1 + 48} y={(k0 + k1) / 2 - 2} bold size={12.5}>
                  8 min sur 15
                </Txt>
                <Txt x={x1 + 48} y={(k0 + k1) / 2 + 14} tone="muted" size={12}>
                  la moitié du temps
                </Txt>
              </g>
            )}
          </Svg>
        );
      }}
    />
  );
}
