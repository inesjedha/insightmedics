import { Dot, LegendItem, Lines, Responsive, Svg, Txt } from "@/components/guides/figures/chart";
import { LinePlot } from "@/components/guides/figures/LinePlot";
import { NARROW, fr, lin, pct, range } from "@/components/guides/figures/scale";

/**
 * Exemple du guide « Courbe ROC » : 150 enfants, 60 appendicites (VP + FN) et 90 sans
 * (VN + FP), CRP à l'admission.
 *
 * La courbe empirique est un escalier : chaque pas vers le haut est un malade (1/60), chaque pas
 * vers la droite un non-malade (1/90), dans l'ordre décroissant de la CRP. La séquence ci-dessous
 * passe exactement par les cinq seuils du tableau du guide, son aire vaut 4 719 / 5 400 = 0,874,
 * et l'indice de Youden y est maximal au seuil de 30 mg/L (J = 0,606), comme dans le texte.
 */
const MOVES =
  "UUUURUUUUUUUURUUUUUUURUUUUUURUUURUUURUUURUURUURUURURUURURRURURRURURRURURURRURRURRRURRRRURRRRURRRRRURRRRRRURRRRRRRRRRRRURRRRRRRRRRRRRRRRRRURRRRRRRRRRRR";
const NPOS = 60;
const NNEG = 90;

/** Seuils du tableau du guide : (faux positifs, vrais positifs) parmi 90 et 60. */
const THRESHOLDS = [
  { s: 10, fp: 52, tp: 58 },
  { s: 20, fp: 35, tp: 55 },
  { s: 30, fp: 22, tp: 51 },
  { s: 50, fp: 11, tp: 42 },
  { s: 80, fp: 4, tp: 27 },
];

const stairs = () => {
  let fp = 0;
  let tp = 0;
  const pts: [number, number][] = [[0, 0]];
  for (const c of MOVES) {
    if (c === "U") tp += 1;
    else fp += 1;
    pts.push([fp / NNEG, tp / NPOS]);
  }
  return pts;
};

export function RocCurve() {
  const pts = stairs();
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const ml = 48;
        const top = 30;
        const size = narrow ? w - ml - 22 : 300;
        const x0 = ml;
        const x1 = ml + size;
        const y0 = top;
        const y1 = top + size;
        const sx = lin(0, 1, x0, x1);
        const sy = lin(0, 1, y1, y0);
        const d = pts
          .map(([a, b], i) => `${i ? "L" : "M"}${sx(a).toFixed(1)},${sy(b).toFixed(1)}`)
          .join("");
        const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
        const you = THRESHOLDS[2];
        const yx = you.fp / NNEG;
        const yy = you.tp / NPOS;
        // Légende et lecture : à droite sur grand écran, sous le graphique sur téléphone.
        const kx = narrow ? 0 : x1 + 40;
        const ky = narrow ? y1 + 72 : top + 18;
        const h = narrow ? ky + 132 : y1 + 50;
        return (
          <Svg
            w={w}
            h={h}
            label="Courbe ROC empirique de la CRP pour le diagnostic d'appendicite, 150 enfants dont 60 malades. Aire sous la courbe 0,874, IC 95 % 0,812 à 0,936. Seuils : 10 mg/L (sensibilité 96,7 %, 1 − spécificité 57,8 %), 20 mg/L (91,7 %, 38,9 %), 30 mg/L (85,0 %, 24,4 %), 50 mg/L (70,0 %, 12,2 %), 80 mg/L (45,0 %, 4,4 %). L'indice de Youden est maximal à 30 mg/L, J = 0,606, la plus grande distance verticale entre la courbe et la diagonale."
          >
            <Txt x={0} y={14} tone="muted">
              Sensibilité
            </Txt>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={x0}
                  x2={x1}
                  y1={sy(t)}
                  y2={sy(t)}
                  className={t === 0 ? "stroke-foreground/35" : "stroke-border"}
                />
                <line
                  x1={sx(t)}
                  x2={sx(t)}
                  y1={y0}
                  y2={y1}
                  className={t === 0 ? "stroke-foreground/35" : "stroke-border"}
                />
                <Txt x={x0 - 8} y={sy(t) + 4.5} anchor="end" tone="muted">
                  {`${Math.round(t * 100)} %`}
                </Txt>
                <Txt x={sx(t)} y={y1 + 20} anchor="middle" tone="muted">
                  {`${Math.round(t * 100)} %`}
                </Txt>
              </g>
            ))}
            <Txt x={(x0 + x1) / 2} y={y1 + 40} anchor="middle" tone="muted">
              1 − spécificité (faux positifs chez les non-malades)
            </Txt>

            {/* Aire sous la courbe : voile de 10 % */}
            <path d={`${d}L${x1},${y1}Z`} className="fill-brand opacity-10" />
            {/* Diagonale du hasard */}
            <line
              x1={x0}
              y1={y1}
              x2={x1}
              y2={y0}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              className="stroke-muted-foreground"
            />
            <text
              transform={`translate(${sx(0.72) - 9},${sy(0.72) - 9}) rotate(-45)`}
              textAnchor="middle"
              className="fill-muted-foreground"
            >
              Hasard (AUC = 0,5)
            </text>

            {/* Indice de Youden : distance verticale courbe – diagonale */}
            <line
              x1={sx(yx)}
              x2={sx(yx)}
              y1={sy(yx)}
              y2={sy(yy)}
              strokeWidth={2}
              className="stroke-foreground"
            />
            <Lines
              x={sx(yx) + 8}
              y={sy((yx + yy) / 2 + 0.07) + 4}
              lines={["J = 0,606", "(Youden)"]}
              lh={16}
            />

            {/* La courbe */}
            <path
              d={d}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              className="stroke-brand"
            />

            {/* Seuils du tableau */}
            {THRESHOLDS.map((t) => {
              const cx = sx(t.fp / NNEG);
              const cy = sy(t.tp / NPOS);
              const best = t.s === 30;
              const se = (100 * t.tp) / NPOS;
              const sp = 100 - (100 * t.fp) / NNEG;
              return (
                <g key={t.s}>
                  <Dot
                    cx={cx}
                    cy={cy}
                    r={best ? 6 : 4.5}
                    className={best ? "fill-foreground" : "fill-brand"}
                    title={`Seuil ${t.s} mg/L : sensibilité ${pct(se)}, spécificité ${pct(sp)}, J = ${fr(se / 100 + sp / 100 - 1, 3)}`}
                  />
                  <Txt x={cx + 9} y={cy + 17} bold={best}>
                    {narrow ? `${t.s}` : `${t.s} mg/L`}
                  </Txt>
                </g>
              );
            })}

            {/* Légende et lecture */}
            <LegendItem x={kx} y={ky} label="CRP (courbe empirique)" />
            <g>
              <line
                x1={kx}
                x2={kx + 18}
                y1={ky + 22 - 4.5}
                y2={ky + 22 - 4.5}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                className="stroke-muted-foreground"
              />
              <Txt x={kx + 24} y={ky + 22}>
                Diagonale du hasard
              </Txt>
            </g>
            <LegendItem
              x={kx}
              y={ky + 44}
              kind="dot"
              className="fill-brand"
              label={narrow ? "Seuil du tableau (CRP, mg/L)" : "Seuil du tableau"}
            />
            <LegendItem
              x={kx}
              y={ky + 66}
              kind="dot"
              className="fill-foreground"
              label="Seuil de Youden"
            />
            <Lines
              x={kx}
              y={ky + (narrow ? 104 : 116)}
              lines={["AUC = 0,874", "IC 95 % 0,812 – 0,936"]}
              bold
              lh={18}
            />
            {!narrow && (
              <Lines
                x={kx}
                y={ky + 172}
                tone="muted"
                lh={17}
                lines={[
                  "Au seuil de 30 mg/L :",
                  "sensibilité 85,0 %",
                  "spécificité 75,6 %",
                  "J = 0,850 + 0,756 − 1",
                  "   = 0,606",
                ]}
              />
            )}
          </Svg>
        );
      }}
    />
  );
}

/** VPP et VPN selon la prévalence, à sensibilité 85,0 % et spécificité 75,6 % fixes (théorème de Bayes). */
export function PrevalenceCurve() {
  const se = 51 / 60;
  const sp = 68 / 90;
  const vpp = (p: number) => (100 * se * p) / (se * p + (1 - sp) * (1 - p));
  const vpn = (p: number) => (100 * sp * (1 - p)) / (sp * (1 - p) + (1 - se) * p);
  const xs = [0.005, ...range(0.01, 0.5, 0.005)];
  const at = [0.02, 0.1, 0.4];
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        return (
          <LinePlot
            w={w}
            plotH={narrow ? 210 : 240}
            legend
            label="Valeur prédictive positive et valeur prédictive négative d'un même test (sensibilité 85,0 %, spécificité 75,6 %) selon la prévalence de la maladie. À 2 % de prévalence : VPP 6,6 %, VPN 99,6 %. À 10 % : VPP 27,9 %, VPN 97,8 %. À 40 % : VPP 69,9 %, VPN 88,3 %."
            x={{
              min: 0,
              max: 50,
              ticks: [0, 10, 20, 30, 40, 50],
              format: (v) => `${v} %`,
              title: "Prévalence de la maladie",
            }}
            y={{
              min: 0,
              max: 100,
              ticks: [0, 20, 40, 60, 80, 100],
              format: (v) => `${v} %`,
              title: "Valeur prédictive",
            }}
            refX={at.map((p) => ({ v: p * 100 }))}
            series={[
              {
                id: "vpn",
                label: "VPN (valeur prédictive négative)",
                points: xs.map((p) => [p * 100, vpn(p)]),
                tone: "compare",
              },
              {
                id: "vpp",
                label: "VPP (valeur prédictive positive)",
                points: xs.map((p) => [p * 100, vpp(p)]),
              },
            ]}
            marks={[
              ...at.map((p) => ({
                x: p * 100,
                y: vpp(p),
                label: [pct(vpp(p))],
                dx: p === 0.02 ? 10 : 8,
                dy: p === 0.4 ? 20 : p === 0.02 ? 4 : 14,
                bold: p === 0.4,
                title: `Prévalence ${pct(p * 100, 0)} : VPP ${pct(vpp(p))}`,
              })),
              ...at.map((p) => ({
                x: p * 100,
                y: vpn(p),
                label: [pct(vpn(p))],
                dx: p === 0.02 ? 6 : 8,
                dy: p === 0.4 ? -12 : p === 0.1 ? -10 : 22,
                tone: "compare" as const,
                bold: p === 0.4,
                title: `Prévalence ${pct(p * 100, 0)} : VPN ${pct(vpn(p))}`,
              })),
            ]}
          />
        );
      }}
    />
  );
}
