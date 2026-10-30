import { Lines, Responsive, Svg, Txt, Verdict } from "@/components/guides/figures/chart";
import { NARROW, lin, small } from "@/components/guides/figures/scale";

/**
 * « Mauvaise figure / bonne figure » sur la durée opératoire du Tableau IV fictif :
 * médianes 93 et 73 min, quartiles [67–118] et [60–93], 40 et 80 patients.
 * À gauche, des barres 3D des seules médianes, titre dans l'image, sans unité ni effectif ;
 * à droite, la médiane et l'intervalle interquartile, axe titré, effectifs visibles.
 */

const GROUPS = [
  { name: "Complication", n: 40, med: 93, q1: 67, q3: 118 },
  { name: "Pas de complication", n: 80, med: 73, q1: 60, q3: 93 },
];

function Bad({ x, y, w, narrow }: { x: number; y: number; w: number; narrow: boolean }) {
  const fs = small(narrow);
  const ml = 34;
  const top = y + 64;
  const base = y + 196;
  const sy = lin(0, 100, base, top);
  const depth = 12;
  const bw = 52;
  const cx = (i: number) => x + ml + ((i + 0.5) * (w - ml - 10)) / 2;
  return (
    <g>
      <Verdict x={x + 10} y={y + 10} ok={false} />
      <Txt x={x + 28} y={y + 15} bold>
        À éviter
      </Txt>
      <rect
        x={x + 0.5}
        y={y + 28.5}
        width={w - 1}
        height={200}
        rx={4}
        className="fill-surface stroke-border"
      />
      {/* Titre dans l'image, en capitales */}
      <Txt x={x + w / 2} y={y + 52} anchor="middle" bold size={14} className="tracking-[0.08em]">
        DURÉE OPÉRATOIRE
      </Txt>
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={t}>
          <line x1={x + ml} x2={x + w - 10} y1={sy(t)} y2={sy(t)} className="stroke-border" />
          <Txt x={x + ml - 6} y={sy(t) + 4.5} anchor="end" tone="muted" size={fs}>
            {String(t)}
          </Txt>
        </g>
      ))}
      {GROUPS.map((g, i) => {
        const x0 = cx(i) - bw / 2;
        const yt = sy(g.med);
        return (
          <g key={g.name}>
            <title>{`${g.name} : médiane seule, ${g.med} min`}</title>
            {/* Ombre portée et faces de perspective : de l'encre qui n'est pas de la donnée */}
            <rect
              x={x0 + 7}
              y={yt + 4}
              width={bw}
              height={base - yt}
              className="fill-foreground opacity-10"
            />
            <path
              d={`M${x0 + bw},${yt}l${depth},${-depth}V${base - depth}l${-depth},${depth}Z`}
              className="fill-brand opacity-60"
            />
            <path
              d={`M${x0},${yt}l${depth},${-depth}h${bw}l${-depth},${depth}Z`}
              className="fill-brand opacity-35"
            />
            <rect x={x0} y={yt} width={bw} height={base - yt} className="fill-brand" />
            <Txt x={cx(i)} y={base + 18} anchor="middle" size={fs}>
              {g.name}
            </Txt>
          </g>
        );
      })}
    </g>
  );
}

function Good({ x, y, w, narrow }: { x: number; y: number; w: number; narrow: boolean }) {
  const fs = small(narrow);
  const ml = 40;
  const top = y + 74;
  const base = y + 196;
  const sy = lin(40, 130, base, top);
  const bw = 46;
  const cx = (i: number) => x + ml + ((i + 0.5) * (w - ml - 6)) / 2;
  return (
    <g>
      <Verdict x={x + 10} y={y + 10} ok />
      <Txt x={x + 28} y={y + 15} bold>
        À préférer
      </Txt>
      <Txt x={x} y={y + 48} tone="muted" size={fs}>
        Durée opératoire (min)
      </Txt>
      {[40, 60, 80, 100, 120].map((t) => (
        <g key={t}>
          <line
            x1={x + ml}
            x2={x + w - 6}
            y1={sy(t)}
            y2={sy(t)}
            className={t === 40 ? "stroke-foreground/35" : "stroke-border"}
          />
          <Txt x={x + ml - 6} y={sy(t) + 4.5} anchor="end" tone="muted" size={fs}>
            {String(t)}
          </Txt>
        </g>
      ))}
      {GROUPS.map((g, i) => (
        <g key={g.name}>
          <title>{`${g.name} (n = ${g.n}) : médiane ${g.med} min [${g.q1}–${g.q3}]`}</title>
          <rect
            x={cx(i) - bw / 2}
            y={sy(g.q3)}
            width={bw}
            height={sy(g.q1) - sy(g.q3)}
            rx={3}
            strokeWidth={1.5}
            className="fill-brand/15 stroke-brand"
          />
          <line
            x1={cx(i) - bw / 2}
            x2={cx(i) + bw / 2}
            y1={sy(g.med)}
            y2={sy(g.med)}
            strokeWidth={3}
            className="stroke-brand"
          />
          <Txt x={cx(i)} y={sy(g.q3) - 8} anchor="middle" size={12.5}>
            {`${g.med} [${g.q1}–${g.q3}]`}
          </Txt>
          <Lines
            x={cx(i)}
            y={base + 18}
            anchor="middle"
            size={fs}
            lh={15}
            lines={[g.name, `n = ${g.n}`]}
          />
        </g>
      ))}
      <Txt x={x} y={base + 56} tone="muted" size={fs}>
        Boîte : Q1 à Q3 ; trait épais : médiane
      </Txt>
    </g>
  );
}

export function BarVsBox() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const pw = narrow ? w : (w - 30) / 2;
        const ph = 264;
        const h = narrow ? 2 * ph + 20 : ph;
        return (
          <Svg
            w={w}
            h={h}
            label="Deux figures de la durée opératoire selon la survenue d'une complication. À éviter : des barres en 3D des seules médianes, 93 et 73, avec le titre dans l'image, sans unité ni effectif. À préférer : des boîtes allant du premier au troisième quartile avec la médiane, 93 minutes [67–118] pour 40 patients avec complication et 73 minutes [60–93] pour 80 patients sans complication, axe titré en minutes."
          >
            <Bad x={0} y={0} w={pw} narrow={narrow} />
            <Good x={narrow ? 0 : pw + 30} y={narrow ? ph + 20 : 0} w={pw} narrow={narrow} />
          </Svg>
        );
      }}
    />
  );
}
