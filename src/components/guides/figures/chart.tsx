import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FONT, NARROW, WIDE } from "@/components/guides/figures/scale";

/**
 * Dessine le schéma deux fois, à la largeur « téléphone » et à la largeur « grand écran », et
 * laisse une requête de conteneur afficher la bonne version. Le texte garde ainsi la même taille
 * à l'écran partout (≈ 13 px), sans JavaScript ni saut de mise en page.
 */
export function Responsive({ render }: { render: (w: number) => ReactNode }) {
  return (
    <div className="@container">
      <div className="@min-[520px]:hidden">{render(NARROW)}</div>
      <div className="hidden @min-[520px]:block">{render(WIDE)}</div>
    </div>
  );
}

/** SVG responsive, accessible (role="img" + aria-label), dans la police du site. */
export function Svg({
  w,
  h,
  label,
  children,
  className,
  style,
}: {
  w: number;
  h: number;
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      role="img"
      aria-label={label}
      className={cn("block h-auto", className)}
      style={{ fontSize: FONT, ...style }}
    >
      {children}
    </svg>
  );
}

/**
 * Pour les maquettes d'écran (grille Excel, SPSS, tableau) : largeur minimale fixe, défilement
 * horizontal sur téléphone, comme les tableaux des guides.
 */
export function ScrollSvg({
  w,
  h,
  label,
  children,
  maxWidth,
}: {
  w: number;
  h: number;
  label: string;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <Svg
        w={w}
        h={h}
        label={label}
        className="mx-auto"
        style={{ minWidth: w, maxWidth: maxWidth ?? Math.round(w * 1.15) }}
      >
        {children}
      </Svg>
    </div>
  );
}

type Tone = "ink" | "muted" | "brand" | "danger" | "onBrand";

const TONE: Record<Tone, string> = {
  ink: "fill-foreground",
  muted: "fill-muted-foreground",
  brand: "fill-brand",
  danger: "fill-destructive",
  onBrand: "fill-brand-foreground",
};

/** Texte de schéma : encre, gris ou bleu de la marque ; `y` est la ligne de base. */
export function Txt({
  x,
  y,
  children,
  tone = "ink",
  anchor = "start",
  bold,
  size,
  italic,
  className,
}: {
  x: number;
  y: number;
  children: ReactNode;
  tone?: Tone;
  anchor?: "start" | "middle" | "end";
  bold?: boolean;
  size?: number;
  italic?: boolean;
  className?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      className={cn(TONE[tone], bold && "font-semibold", italic && "italic", className)}
    >
      {children}
    </text>
  );
}

/** Plusieurs lignes de texte, `y` étant la ligne de base de la première. */
export function Lines({
  x,
  y,
  lines,
  lh = 17,
  tone = "ink",
  anchor = "start",
  bold,
  size,
}: {
  x: number;
  y: number;
  lines: ReactNode[];
  lh?: number;
  tone?: Tone;
  anchor?: "start" | "middle" | "end";
  bold?: boolean;
  size?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      className={cn(TONE[tone], bold && "font-semibold")}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/** Point de donnée : ≥ 8 px, anneau de 2 px couleur du fond, info-bulle native. */
export function Dot({
  cx,
  cy,
  r = 4.5,
  className = "fill-brand",
  title,
}: {
  cx: number;
  cy: number;
  r?: number;
  className?: string;
  title?: string;
}) {
  return (
    <g>
      {title && <title>{title}</title>}
      <circle cx={cx} cy={cy} r={Math.max(r + 8, 12)} className="fill-transparent" />
      <circle cx={cx} cy={cy} r={r} strokeWidth={2} className={cn("stroke-card", className)} />
    </g>
  );
}

/** Pastille numérotée (renvoi vers une légende). */
export function Badge({
  x,
  y,
  n,
  tone = "brand",
}: {
  x: number;
  y: number;
  n: ReactNode;
  tone?: "brand" | "danger";
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={10}
        strokeWidth={2}
        className={cn("stroke-card", tone === "brand" ? "fill-brand" : "fill-destructive")}
      />
      <text
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        className={cn(
          "font-semibold",
          tone === "brand" ? "fill-brand-foreground" : "fill-destructive-foreground",
        )}
      >
        {n}
      </text>
    </g>
  );
}

/** Coche « à préférer » ou croix « à éviter », dans un cercle de 20 px. */
export function Verdict({ x, y, ok }: { x: number; y: number; ok: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} className={ok ? "fill-brand" : "fill-destructive"} />
      {ok ? (
        <path
          d={`M${x - 4.5},${y + 0.5}l3,3l6,-6.5`}
          fill="none"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-brand-foreground"
        />
      ) : (
        <path
          d={`M${x - 4},${y - 4}l8,8M${x + 4},${y - 4}l-8,8`}
          fill="none"
          strokeWidth={2.2}
          strokeLinecap="round"
          className="stroke-destructive-foreground"
        />
      )}
    </g>
  );
}

/** Pastille de légende : un trait (courbes) ou un carré arrondi (barres), puis le libellé. */
export function LegendItem({
  x,
  y,
  label,
  kind = "line",
  className = "stroke-brand",
}: {
  x: number;
  y: number;
  label: ReactNode;
  kind?: "line" | "rect" | "dot";
  className?: string;
}) {
  return (
    <g>
      {kind === "line" && (
        <line
          x1={x}
          x2={x + 18}
          y1={y - 4.5}
          y2={y - 4.5}
          strokeWidth={2.5}
          strokeLinecap="round"
          className={className}
        />
      )}
      {kind === "rect" && <rect x={x} y={y - 11} width={14} height={12} rx={3} className={className} />}
      {kind === "dot" && <circle cx={x + 7} cy={y - 4.5} r={5} className={className} />}
      <Txt x={x + (kind === "line" ? 24 : 20)} y={y}>
        {label}
      </Txt>
    </g>
  );
}

/** Flèche simple (trait + pointe), pour les diagrammes. */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  className = "stroke-muted-foreground",
  head = 6,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className?: string;
  head?: number;
}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx1 = x2 - head * Math.cos(a - Math.PI / 6);
  const hy1 = y2 - head * Math.sin(a - Math.PI / 6);
  const hx2 = x2 - head * Math.cos(a + Math.PI / 6);
  const hy2 = y2 - head * Math.sin(a + Math.PI / 6);
  return (
    <g className={className} fill="none" strokeWidth={1.5} strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${hx1},${hy1}L${x2},${y2}L${hx2},${hy2}`} strokeLinejoin="round" />
    </g>
  );
}
