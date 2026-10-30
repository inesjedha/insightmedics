import { Responsive, Svg, Txt } from "@/components/guides/figures/chart";
import { LinePlot } from "@/components/guides/figures/LinePlot";
import { NARROW, fr, lin, normCdf, pct, range, vBarPath } from "@/components/guides/figures/scale";

/**
 * Courbes de la planification d'une étude : puissance selon l'effectif, précision d'une
 * proportion selon l'effectif, et inflation du risque alpha avec le nombre de tests.
 * Tous les points sont calculés ici, avec les formules du guide.
 */

const Z_ALPHA = 1.959964;

/** Puissance pour comparer deux proportions, formule simplifiée du guide (variances séparées). */
const power2p = (p1: number, p2: number, n: number) =>
  normCdf((Math.abs(p1 - p2) * Math.sqrt(n)) / Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)) - Z_ALPHA);

/** Demi-largeur de l'IC 95 % d'une proportion, en points de pourcentage. */
const halfWidth = (p: number, n: number) => 100 * 1.96 * Math.sqrt((p * (1 - p)) / n);

const pctTick = (v: number) => `${v} %`;

/** Puissance selon le nombre de patients par groupe : infection 30 % contre 15 %. */
export function PowerCurve() {
  const pts = range(10, 300, 2).map((n) => [n, 100 * power2p(0.3, 0.15, n)] as [number, number]);
  const p80 = 100 * power2p(0.3, 0.15, 80);
  const p118 = 100 * power2p(0.3, 0.15, 118);
  return (
    <Responsive
      render={(w) => (
        <LinePlot
          w={w}
          plotH={w === NARROW ? 200 : 240}
          label={`Courbe de puissance pour détecter une baisse du taux d'infection de 30 % à 15 %, alpha 5 % bilatéral. La puissance croît avec l'effectif : environ ${fr(p80, 0)} % avec 80 patients par groupe, 80 % avec 118 patients par groupe.`}
          x={{
            min: 0,
            max: 300,
            ticks: [0, 50, 100, 150, 200, 250, 300],
            format: (v) => `${v}`,
            title: "Patients par groupe",
          }}
          y={{
            min: 0,
            max: 100,
            ticks: [0, 20, 40, 60, 80, 100],
            format: pctTick,
            title: "Puissance",
          }}
          series={[{ id: "p", label: "Puissance", points: pts }]}
          refY={[{ v: 80, label: "80 % visés", labelAnchor: "end" }]}
          marks={[
            {
              x: 80,
              y: p80,
              label: ["80 par groupe", `puissance ≈ ${fr(p80, 0)} %`],
              dx: 12,
              dy: 22,
              title: `80 patients par groupe : puissance ${pct(p80)}`,
            },
            {
              x: 118,
              y: p118,
              label: ["118 par groupe", "puissance 80 %"],
              dx: -12,
              dy: -30,
              anchor: "end",
              bold: true,
              title: `118 patients par groupe : puissance ${pct(p118)}`,
            },
          ]}
        />
      )}
    />
  );
}

/** Précision (demi-largeur de l'IC 95 %) selon l'effectif, pour une prévalence de 30 % et de 50 %. */
export function PrecisionCurve() {
  const curve = (p: number) =>
    range(50, 600, 5).map((n) => [n, halfWidth(p, n)] as [number, number]);
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        return (
          <LinePlot
            w={w}
            plotH={narrow ? 200 : 230}
            legend
            label="Précision de l'estimation d'une proportion selon le nombre de patients. Pour une prévalence attendue de 30 %, 165 patients donnent une précision de plus ou moins 7 points et 323 patients de plus ou moins 5 points ; pour 50 %, il faut 385 patients pour plus ou moins 5 points."
            x={{
              min: 0,
              max: 600,
              ticks: narrow ? [0, 200, 400, 600] : [0, 100, 200, 300, 400, 500, 600],
              format: (v) => `${v}`,
              title: "Nombre de patients",
            }}
            y={{
              min: 0,
              max: 15,
              ticks: [0, 5, 10, 15],
              format: (v) => (v === 0 ? "0" : `± ${v}`),
              title: "Précision de l'IC 95 % (points)",
            }}
            series={[
              {
                id: "p50",
                label: "Prévalence attendue 50 % (aucune donnée)",
                points: curve(0.5),
                tone: "compare",
              },
              { id: "p30", label: "Prévalence attendue 30 %", points: curve(0.3) },
            ]}
            marks={[
              {
                x: 165,
                y: halfWidth(0.3, 165),
                label: ["165 patients", "± 7 points"],
                dx: narrow ? 22 : -10,
                dy: narrow ? -46 : 22,
                anchor: narrow ? "start" : "end",
                leader: narrow,
                title: `30 % attendus, 165 patients : ± ${fr(halfWidth(0.3, 165), 1)} points`,
              },
              {
                x: 323,
                y: halfWidth(0.3, 323),
                label: ["323 patients", "± 5 points"],
                dx: -10,
                dy: 22,
                anchor: "end",
                bold: true,
                title: `30 % attendus, 323 patients : ± ${fr(halfWidth(0.3, 323), 1)} points`,
              },
              {
                x: 385,
                y: halfWidth(0.5, 385),
                label: ["385 patients", "± 5 points"],
                dx: 10,
                dy: -26,
                tone: "compare",
                title: `50 % attendus, 385 patients : ± ${fr(halfWidth(0.5, 385), 1)} points`,
              },
            ]}
          />
        );
      }}
    />
  );
}

/** Probabilité d'au moins un p < 0,05 par hasard selon le nombre de tests indépendants. */
export function AlphaInflation() {
  const ks = range(1, 20, 1);
  // Produit répété plutôt que `**` : même résultat au bit près côté serveur et navigateur.
  const prob = (k: number) => {
    let q = 1;
    for (let i = 0; i < k; i += 1) q *= 0.95;
    return Math.round(100000 * (1 - q)) / 1000;
  };
  const shown = new Set([1, 5, 10, 20]);
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const ml = 46;
        const mr = 10;
        const top = 30;
        const plotH = narrow ? 190 : 220;
        const y1 = top + plotH;
        const slot = (w - ml - mr) / ks.length;
        const bw = Math.min(narrow ? 9 : 18, slot - 2);
        const sy = lin(0, 80, y1, top);
        const cx = (k: number) => ml + (k - 0.5) * slot;
        return (
          <Svg
            w={w}
            h={y1 + 50}
            label="Diagramme en colonnes : probabilité d'obtenir au moins un p inférieur à 0,05 par le seul hasard, selon le nombre de comparaisons indépendantes, quand aucune différence n'existe. 5 % pour un test, 22,6 % pour 5 tests, 40,1 % pour 10 tests, 64,2 % pour 20 tests."
          >
            <Txt x={0} y={14} tone="muted">
              Probabilité d'au moins un p &lt; 0,05 par hasard
            </Txt>
            {[0, 20, 40, 60, 80].map((t) => (
              <g key={t}>
                <line
                  x1={ml}
                  x2={w - mr}
                  y1={sy(t)}
                  y2={sy(t)}
                  className={t === 0 ? "stroke-foreground/35" : "stroke-border"}
                />
                <Txt x={ml - 8} y={sy(t) + 4.5} anchor="end" tone="muted">
                  {t} %
                </Txt>
              </g>
            ))}
            {ks.map((k) => (
              <g key={k}>
                <title>{`${k} test${k > 1 ? "s" : ""} : ${pct(prob(k))}`}</title>
                <rect
                  x={cx(k) - slot / 2}
                  y={top}
                  width={slot}
                  height={plotH}
                  className="fill-transparent"
                />
                <path
                  d={vBarPath(cx(k) - bw / 2, bw, sy(prob(k)), y1, Math.min(4, bw / 2))}
                  className={shown.has(k) ? "fill-brand" : "fill-brand/45"}
                />
                {k === 1 && (
                  <line
                    x1={cx(k)}
                    x2={cx(k)}
                    y1={sy(prob(k)) - 3}
                    y2={sy(24) + 4}
                    className="stroke-muted-foreground"
                  />
                )}
                {shown.has(k) && (
                  <Txt
                    x={k === 20 ? cx(k) + bw / 2 + 2 : k === 1 ? cx(k) - bw / 2 : cx(k)}
                    y={k === 1 ? sy(24) : sy(prob(k)) - 8}
                    anchor={k === 20 ? "end" : k === 1 ? "start" : "middle"}
                    bold={k === 20}
                  >
                    {pct(prob(k))}
                  </Txt>
                )}
                {(k === 1 || k % 5 === 0) && (
                  <Txt x={cx(k)} y={y1 + 20} anchor="middle" tone="muted">
                    {k}
                  </Txt>
                )}
              </g>
            ))}
            <Txt x={(ml + w - mr) / 2} y={y1 + 40} anchor="middle" tone="muted">
              Nombre de comparaisons (tests indépendants)
            </Txt>
          </Svg>
        );
      }}
    />
  );
}
