import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Responsive, Svg, Txt, Verdict } from "@/components/guides/figures/chart";
import { NARROW, small } from "@/components/guides/figures/scale";

/**
 * Maquettes de tableur : une saisie inexploitable face à la même patiente bien saisie, et
 * l'harmonisation des codes (texte libre et données inconnues).
 */

type Col = { name: string; w: number; value: string; num?: boolean };

/** Grille façon tableur : lettres de colonnes, numéros de lignes, une ligne d'en-tête. */
function Sheet({
  x,
  y,
  cols,
  rowNum,
  highlight,
  narrow,
}: {
  x: number;
  y: number;
  cols: Col[];
  rowNum: number;
  highlight?: number;
  narrow: boolean;
}) {
  const fs = small(narrow);
  const letterH = 20;
  const rowH = 26;
  let cx = x + rowNum;
  const xs = cols.map((c) => {
    const x0 = cx;
    cx += c.w;
    return x0;
  });
  const right = cx;
  const ys = [y, y + letterH, y + letterH + rowH];
  const bottom = y + letterH + 2 * rowH;
  return (
    <g fontSize={fs}>
      {/* Bandeau des lettres et colonne des numéros */}
      <rect x={x} y={y} width={right - x} height={letterH} className="fill-surface" />
      {rowNum > 0 && (
        <rect x={x} y={y} width={rowNum} height={bottom - y} className="fill-surface" />
      )}
      {highlight !== undefined && (
        <rect
          x={xs[highlight] + 1}
          y={y + letterH + 1}
          width={cols[highlight].w - 2}
          height={2 * rowH - 2}
          strokeWidth={2}
          className="fill-accent stroke-brand"
        />
      )}
      {/* Filets */}
      {[...xs, right].map((vx, i) => (
        <line key={`v${i}`} x1={vx} x2={vx} y1={y} y2={bottom} className="stroke-border" />
      ))}
      {rowNum > 0 && <line x1={x} x2={x} y1={y} y2={bottom} className="stroke-border" />}
      {[y, ...ys.slice(1), bottom].map((hy, i) => (
        <line key={`h${i}`} x1={x} x2={right} y1={hy} y2={hy} className="stroke-border" />
      ))}
      {cols.map((c, i) => (
        <g key={c.name + i}>
          <Txt x={xs[i] + c.w / 2} y={y + 14} anchor="middle" tone="muted" size={fs}>
            {String.fromCharCode(65 + i)}
          </Txt>
          <Txt x={xs[i] + 5} y={ys[1] + 17} bold size={fs}>
            {c.name}
          </Txt>
          <Txt
            x={c.num ? xs[i] + c.w - 5 : xs[i] + 5}
            y={ys[2] + 17}
            anchor={c.num ? "end" : "start"}
            size={fs}
          >
            {c.value}
          </Txt>
        </g>
      ))}
      {rowNum > 0 &&
        [1, 2].map((n) => (
          <Txt key={n} x={x + rowNum / 2} y={ys[n] + 17} anchor="middle" tone="muted" size={fs}>
            {String(n)}
          </Txt>
        ))}
    </g>
  );
}

function PanelTitle({
  x,
  y,
  ok,
  children,
}: {
  x: number;
  y: number;
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <g>
      <Verdict x={x + 10} y={y - 5} ok={ok} />
      <Txt x={x + 28} y={y} bold>
        {children}
      </Txt>
    </g>
  );
}

/** « Mme, 54 ans, HTA, Hb 115, entrée le 12/3/23 » : une cellule, puis une ligne exploitable. */
export function EntryGrid() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const rowNum = narrow ? 0 : 26;
        const goodCols: Col[] = narrow
          ? [
              { name: "id", w: 40, value: "P001" },
              { name: "sexe", w: 38, value: "2", num: true },
              { name: "age", w: 34, value: "54", num: true },
              { name: "hta", w: 32, value: "1", num: true },
              { name: "diabete", w: 54, value: "0", num: true },
              { name: "hb_gdl", w: 52, value: "11,5", num: true },
              { name: "date_adm", w: w - 250, value: "12/03/2023", num: true },
            ]
          : [
              { name: "id", w: 56, value: "P001" },
              { name: "sexe", w: 52, value: "2", num: true },
              { name: "age", w: 48, value: "54", num: true },
              { name: "hta", w: 46, value: "1", num: true },
              { name: "diabete", w: 66, value: "0", num: true },
              { name: "hb_gdl", w: 64, value: "11,5", num: true },
              { name: "date_adm", w: 92, value: "12/03/2023", num: true },
            ];
        const badCols: Col[] = [
          {
            name: "renseignements",
            w: narrow ? w - rowNum : 330,
            value: "Mme, 54 ans, HTA, Hb 115, entrée le 12/3/23",
          },
        ];
        const g0 = 114;
        const gridW = rowNum + goodCols.reduce((a, c) => a + c.w, 0);
        const notesY = g0 + 24 + 72 + 22;
        const notes = narrow
          ? [
              "Une ligne = une patiente ; une colonne = une",
              "variable ; une cellule = une information.",
              "Codes : sexe 1 = homme, 2 = femme ;",
              "hta, diabete 0 = non, 1 = oui ; Hb en g/dL.",
            ]
          : [
              "Une ligne = une patiente ; une colonne = une variable ; une cellule = une information.",
              "Codes du dictionnaire : sexe 1 = homme, 2 = femme ; hta et diabete 0 = non, 1 = oui.",
              "L'hémoglobine est convertie dans l'unité de la colonne : 115 g/L devient 11,5 g/dL.",
            ];
        const h = notesY + (notes.length - 1) * 18 + 8;
        return (
          <Svg
            w={w}
            h={h}
            label="Deux saisies de la même patiente. À éviter : une seule cellule « Mme, 54 ans, HTA, Hb 115, entrée le 12/3/23 », inexploitable. À préférer : une ligne avec les colonnes id P001, sexe 2, age 54, hta 1, diabete 0, hb_gdl 11,5 et date_adm 12/03/2023."
          >
            <PanelTitle x={0} y={16} ok={false}>
              Tout dans une cellule
            </PanelTitle>
            <Sheet x={0} y={28} cols={badCols} rowNum={rowNum} narrow={narrow} />
            <PanelTitle x={0} y={g0 + 14} ok>
              Une ligne par patiente, une colonne par variable
            </PanelTitle>
            <Sheet
              x={0}
              y={g0 + 26}
              cols={goodCols}
              rowNum={rowNum}
              highlight={5}
              narrow={narrow}
            />
            {!narrow && (
              <Txt x={gridW + 12} y={g0 + 26 + 20 + 26 + 17} tone="muted" size={small(narrow)}>
                ← unité dans le nom
              </Txt>
            )}
            {notes.map((n, i) => (
              <Txt
                key={n}
                x={0}
                y={notesY + i * 18}
                tone={i < (narrow ? 2 : 1) ? "ink" : "muted"}
                size={narrow ? 12.5 : undefined}
              >
                {n}
              </Txt>
            ))}
          </Svg>
        );
      }}
    />
  );
}

type Group = {
  title: string;
  before: string[];
  after: string;
  afterNote: string[];
  empty?: boolean;
};

/** Plusieurs écritures pour une même réponse, ramenées à un seul code. */
export function Recoding() {
  const groups: Group[] = [
    {
      title: "Texte libre non codé",
      before: ["Oui", "oui", "O", "+", "présent"],
      after: "1",
      afterNote: ["1 = oui, 0 = non, partout"],
    },
    {
      title: "Donnée inconnue mal saisie",
      before: ["0", "NR", "?", "/"],
      after: "",
      afterNote: ["cellule vide : exclue du calcul,", "le dénominateur réel s'affiche"],
      empty: true,
    },
  ];
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const gw = narrow ? w : (w - 30) / 2;
        const gh = 196;
        const h = narrow ? 2 * gh - 10 : gh;
        return (
          <Svg
            w={w}
            h={h}
            label="Harmoniser les saisies. Les écritures « Oui », « oui », « O », « + » et « présent » deviennent toutes le code 1. Une donnée inconnue saisie « 0 », « NR », « ? » ou « / » devient une cellule vide."
          >
            {groups.map((g, gi) => {
              const gx = narrow ? 0 : gi * (gw + 30);
              const gy = narrow ? gi * (gh - 10) : 0;
              const chipW = (s: string) => Math.max(36, s.length * 7 + 22);
              const total = g.before.reduce((a, s) => a + chipW(s), 0) + (g.before.length - 1) * 8;
              let cx = gx + (gw - total) / 2;
              const chips = g.before.map((s) => {
                const c = { s, x: cx, w: chipW(s) };
                cx += c.w + 8;
                return c;
              });
              const chipY = gy + 32;
              const tx = gx + gw / 2;
              const ty = gy + 112;
              return (
                <g key={g.title}>
                  <Txt x={gx + gw / 2} y={gy + 14} anchor="middle" bold>
                    {g.title}
                  </Txt>
                  {chips.map((c) => (
                    <g key={c.s}>
                      <line
                        x1={c.x + c.w / 2}
                        y1={chipY + 26}
                        x2={tx}
                        y2={ty - 4}
                        strokeWidth={1.25}
                        className="stroke-muted-foreground/70"
                      />
                      <rect
                        x={c.x}
                        y={chipY}
                        width={c.w}
                        height={26}
                        rx={4}
                        className="fill-card stroke-destructive"
                      />
                      <Txt x={c.x + c.w / 2} y={chipY + 17.5} anchor="middle" size={12.5}>
                        {c.s}
                      </Txt>
                    </g>
                  ))}
                  <rect
                    x={tx - 50}
                    y={ty}
                    width={100}
                    height={34}
                    rx={4}
                    strokeWidth={2}
                    strokeDasharray={g.empty ? "5 4" : undefined}
                    className={cn(g.empty ? "fill-card stroke-brand" : "fill-accent stroke-brand")}
                  />
                  {g.after && (
                    <Txt x={tx} y={ty + 23} anchor="middle" bold size={17}>
                      {g.after}
                    </Txt>
                  )}
                  {g.afterNote.map((n, i) => (
                    <Txt key={n} x={tx} y={ty + 56 + i * 17} anchor="middle" tone="muted">
                      {n}
                    </Txt>
                  ))}
                </g>
              );
            })}
          </Svg>
        );
      }}
    />
  );
}
