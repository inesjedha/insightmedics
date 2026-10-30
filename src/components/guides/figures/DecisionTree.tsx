import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Responsive, Svg, Txt } from "@/components/guides/figures/chart";
import { NARROW } from "@/components/guides/figures/scale";

/**
 * Arbre de décision du choix du test, repris ligne à ligne du tableau de décision du guide
 * « Quel test statistique choisir » : type de variable, puis groupes, puis le test.
 */

type Leaf = {
  situation: string;
  /** Libellé sur deux lignes, sur grand écran. */
  situationW?: string[];
  param: string[];
  alt: string[] | null;
  /** Sur téléphone, l'alternative passe à la ligne. */
  wrap?: boolean;
};

const FAMILIES: { name: string[]; nameN: string; leaves: Leaf[] }[] = [
  {
    name: ["Quantitative"],
    nameN: "Variable quantitative",
    leaves: [
      { situation: "2 groupes indépendants", param: ["t de Student"], alt: ["Mann-Whitney"] },
      { situation: "2 mesures appariées", param: ["t de Student apparié"], alt: ["Wilcoxon"] },
      { situation: "3 groupes ou plus", param: ["ANOVA"], alt: ["Kruskal-Wallis"] },
      {
        situation: "3 mesures répétées ou plus",
        param: ["ANOVA à mesures", "répétées"],
        alt: ["Friedman"],
      },
    ],
  },
  {
    name: ["Qualitative"],
    nameN: "Variable qualitative",
    leaves: [
      {
        situation: "Groupes indépendants",
        param: ["Chi-2 de Pearson"],
        alt: ["Fisher (2 × 2)", "si un effectif", "attendu < 5"],
        wrap: true,
      },
      {
        situation: "Binaire, 2 mesures appariées",
        situationW: ["2 mesures appariées", "(variable binaire)"],
        param: ["McNemar"],
        alt: null,
      },
    ],
  },
  {
    name: ["Deux variables", "quantitatives"],
    nameN: "Deux variables quantitatives",
    leaves: [
      {
        situation: "Liaison entre les deux",
        param: ["Corrélation", "de Pearson"],
        alt: ["Corrélation", "de Spearman"],
      },
    ],
  },
  {
    name: ["Délai jusqu'à", "un événement"],
    nameN: "Délai jusqu'à un événement",
    leaves: [{ situation: "2 groupes ou plus", param: ["Log-rank", "(Kaplan-Meier)"], alt: null }],
  },
];

/** Pastille de test : pleine (paramétrique) ou en contour (alternative). */
function Chip({
  x,
  y,
  w,
  lines,
  filled,
  size = 12,
}: {
  x: number;
  y: number;
  w: number;
  lines: string[];
  filled?: boolean;
  size?: number;
}) {
  const h = lines.length * 16 + 12;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2 > 16 ? 10 : h / 2}
        strokeWidth={filled ? 0 : 1.5}
        className={filled ? "fill-brand" : "fill-card stroke-brand"}
      />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize={size}>
        {lines.map((l, i) => (
          <tspan
            key={i}
            x={x + w / 2}
            dy={i === 0 ? 0 : 16}
            className={cn(
              filled ? "fill-brand-foreground" : "fill-foreground",
              i === 0 ? "font-semibold" : "",
              i > 0 && !filled && "fill-muted-foreground",
            )}
          >
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Largeur approchée d'un texte de 12 px en Hanken Grotesk (gras ≈ 7,1 px par signe à 12,5 px). */
const textW = (lines: string[]) => Math.max(...lines.map((l) => l.length)) * 7.1 + 24;

export function TestDecisionTree() {
  return <Responsive render={(w) => (w === NARROW ? <Narrow w={w} /> : <Wide w={w} />)} />;
}

const LABEL =
  "Arbre de choix du test statistique. Variable quantitative : 2 groupes indépendants, t de Student ou Mann-Whitney ; 2 mesures appariées, t de Student apparié ou Wilcoxon ; 3 groupes ou plus, ANOVA ou Kruskal-Wallis ; 3 mesures répétées ou plus, ANOVA à mesures répétées ou Friedman. Variable qualitative : groupes indépendants, Chi-2 de Pearson ou Fisher si tableau 2 × 2 avec un effectif attendu inférieur à 5 ; binaire et 2 mesures appariées, McNemar. Deux variables quantitatives : corrélation de Pearson ou de Spearman. Délai jusqu'à un événement : log-rank avec Kaplan-Meier.";

function Wide({ w }: { w: number }) {
  const c1 = { x: 0, w: 104 };
  const c2 = { x: 116, w: 174 };
  const c3 = { x: 304, w: 148 };
  const c4 = { x: 464, w: w - 466 };
  const top = 34;
  const leafH = (l: Leaf) =>
    Math.max(l.param.length, l.alt?.length ?? 1, l.situationW?.length ?? 1) * 16 + 12;
  const rowGap = 10;
  const famGap = 18;
  let y = top;
  const fams = FAMILIES.map((f) => {
    const y0 = y;
    const leaves = f.leaves.map((l) => {
      const ly = y;
      y += leafH(l) + rowGap;
      return { l, ly, h: leafH(l) };
    });
    const y1 = y - rowGap;
    y += famGap;
    return { f, y0, y1, leaves };
  });
  const h = y - famGap + 62;
  return (
    <Svg w={w} h={h} label={LABEL}>
      {[
        [c1.x, "Variable"],
        [c2.x, "Groupes, mesures"],
        [c3.x, "Test de référence"],
        [c4.x, "Alternative"],
      ].map(([x, t]) => (
        <Txt
          key={t}
          x={Number(x)}
          y={16}
          tone="muted"
          size={12}
          className="uppercase tracking-[0.06em]"
        >
          {String(t)}
        </Txt>
      ))}
      {fams.map(({ f, y0, y1, leaves }) => {
        const fh = y1 - y0;
        const fmid = y0 + fh / 2;
        return (
          <g key={f.nameN}>
            <rect x={c1.x} y={y0} width={c1.w} height={fh} rx={6} className="fill-accent" />
            <text x={c1.x + 10} y={fmid - ((f.name.length - 1) * 16) / 2 + 4.5} fontSize={12}>
              {f.name.map((n, i) => (
                <tspan
                  key={n}
                  x={c1.x + 10}
                  dy={i === 0 ? 0 : 16}
                  className="fill-foreground font-semibold"
                >
                  {n}
                </tspan>
              ))}
            </text>
            {leaves.map(({ l, ly, h: lh }) => {
              const mid = ly + lh / 2;
              return (
                <g key={l.situation}>
                  <title>{`${f.nameN}, ${l.situation} : ${l.param.join(" ")}${l.alt ? `, sinon ${l.alt.join(" ")}` : ""}`}</title>
                  {/* Branche depuis la famille */}
                  <path
                    d={`M${c1.x + c1.w},${fmid}H${c1.x + c1.w + 12}V${mid}H${c2.x}`}
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    className="stroke-muted-foreground"
                  />
                  <rect
                    x={c2.x}
                    y={ly}
                    width={c2.w}
                    height={lh}
                    rx={6}
                    className="fill-surface stroke-border"
                  />
                  <text
                    x={c2.x + 10}
                    y={mid + 4.5 - ((l.situationW?.length ?? 1) - 1) * 8}
                    fontSize={12}
                  >
                    {(l.situationW ?? [l.situation]).map((t, i) => (
                      <tspan
                        key={t}
                        x={c2.x + 10}
                        dy={i === 0 ? 0 : 16}
                        className="fill-foreground"
                      >
                        {t}
                      </tspan>
                    ))}
                  </text>
                  <line
                    x1={c2.x + c2.w}
                    x2={c3.x}
                    y1={mid}
                    y2={mid}
                    strokeWidth={1.5}
                    className="stroke-muted-foreground"
                  />
                  <Chip x={c3.x} y={ly} w={c3.w} lines={l.param} filled />
                  {l.alt ? (
                    <>
                      <line
                        x1={c3.x + c3.w}
                        x2={c4.x}
                        y1={mid}
                        y2={mid}
                        strokeWidth={1.5}
                        className="stroke-border"
                      />
                      <Chip x={c4.x} y={ly} w={c4.w} lines={l.alt} />
                    </>
                  ) : (
                    <Txt x={c4.x + 12} y={mid + 4.5} tone="muted">
                      —
                    </Txt>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      <Legend x={0} y={h - 40} />
    </Svg>
  );
}

function Legend({ x, y, narrow }: { x: number; y: number; narrow?: boolean }) {
  return (
    <g>
      <rect x={x} y={y - 11} width={22} height={14} rx={7} className="fill-brand" />
      <Txt x={x + 30} y={y}>
        {narrow
          ? "Référence (quantitative : ≈ normale)"
          : "Test de référence (variable quantitative : distribution ≈ normale)"}
      </Txt>
      <rect
        x={x}
        y={y + 13}
        width={22}
        height={14}
        rx={7}
        strokeWidth={1.5}
        className="fill-card stroke-brand"
      />
      <Txt x={x + 30} y={y + 24}>
        {narrow
          ? "Alternative (asymétrie, petits effectifs)"
          : "Alternative (quantitative très asymétrique, petits effectifs)"}
      </Txt>
    </g>
  );
}

function Narrow({ w }: { w: number }) {
  const rail = 10;
  const ix = 24;
  let y = 4;
  const items: ReactNode[] = [];
  FAMILIES.forEach((f, fi) => {
    const fy = y;
    items.push(
      <g key={`f${fi}`}>
        <rect x={0} y={fy} width={w} height={30} rx={6} className="fill-accent" />
        <Txt x={12} y={fy + 20} bold>
          {f.nameN}
        </Txt>
      </g>,
    );
    y += 40;
    f.leaves.forEach((l, li) => {
      const sy = y + 12;
      const chipY = y + 22;
      const pw = textW(l.param);
      const ph = l.param.length * 16 + 12;
      const aw = l.alt ? textW(l.alt) : 0;
      const ah = l.alt ? l.alt.length * 16 + 12 : 0;
      const sameRow = !l.wrap && l.alt && ix + pw + 48 + aw <= w;
      const altX = sameRow ? ix + pw + 48 : ix + 48;
      const altY = sameRow ? chipY : chipY + ph + 8;
      const end = l.alt ? Math.max(chipY + ph, altY + ah) : chipY + ph;
      items.push(
        <g key={`l${fi}${li}`}>
          <title>{`${f.nameN}, ${l.situation} : ${l.param.join(" ")}${l.alt ? `, sinon ${l.alt.join(" ")}` : ""}`}</title>
          <path
            d={`M${rail},${y - 6}V${chipY + ph / 2}H${ix}`}
            fill="none"
            strokeWidth={1.5}
            strokeLinejoin="round"
            className="stroke-muted-foreground"
          />
          <Txt x={ix} y={sy} tone="muted">
            {l.situation}
          </Txt>
          <Chip x={ix} y={chipY} w={pw} lines={l.param} filled size={12.5} />
          {l.alt && (
            <>
              <Txt
                x={sameRow ? ix + pw + 8 : ix}
                y={(sameRow ? chipY : altY) + 20}
                tone="muted"
                size={12.5}
              >
                sinon
              </Txt>
              <Chip x={altX} y={altY} w={aw} lines={l.alt} size={12.5} />
            </>
          )}
        </g>,
      );
      y = end + 14;
    });
    y += 8;
  });
  const h = y + 52;
  return (
    <Svg w={w} h={h} label={LABEL}>
      {items}
      <Legend x={0} y={h - 40} narrow />
    </Svg>
  );
}
