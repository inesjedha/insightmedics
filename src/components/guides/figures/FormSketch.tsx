import { Responsive, Svg, Txt, Verdict } from "@/components/guides/figures/chart";
import { NARROW } from "@/components/guides/figures/scale";

/**
 * Fiche de recueil : questions ouvertes (à éviter) contre questions fermées et codées, avec la
 * case « non renseigné » qui distingue « le dossier dit non » de « le dossier ne dit rien ».
 */

function Box({ x, y }: { x: number; y: number }) {
  return (
    <rect
      x={x}
      y={y - 10}
      width={11}
      height={11}
      rx={2}
      strokeWidth={1.25}
      className="fill-card stroke-foreground/70"
    />
  );
}

/** Une ligne d'options cochables : « □ oui (1) □ non (0) □ non renseigné ». */
function Options({ x, y, items }: { x: number; y: number; items: string[] }) {
  let cx = x;
  return (
    <g>
      {items.map((it) => {
        const x0 = cx;
        cx += 17 + it.length * 6.6 + 14;
        return (
          <g key={it}>
            <Box x={x0} y={y} />
            <Txt x={x0 + 17} y={y} size={12.5}>
              {it}
            </Txt>
          </g>
        );
      })}
    </g>
  );
}

const YES_NO = ["oui (1)", "non (0)", "non renseigné"];

export function FormSketch() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const badW = narrow ? w : 232;
        const goodX = narrow ? 0 : 252;
        const goodW = w - goodX;
        const badH = 168;
        const goodY = narrow ? badH + 20 : 0;
        const goodH = 296;
        const h = goodY + goodH;
        const pad = 14;
        const dots = (x: number, y: number, x1: number) => (
          <line
            x1={x}
            x2={x1}
            y1={y}
            y2={y}
            strokeWidth={1.5}
            strokeDasharray="1.5 4"
            strokeLinecap="round"
            className="stroke-muted-foreground"
          />
        );
        const bad = ["Antécédents :", "Évolution :", "Biologie :", "Date d'entrée :"];
        const good: { q: string; opts?: string[]; free?: "creat" | "date" }[] = [
          { q: "HTA", opts: YES_NO },
          { q: "Diabète", opts: YES_NO },
          { q: "Infection du site opératoire à J30", opts: YES_NO },
          { q: "Créatinine à l'admission", free: "creat" },
          { q: "Date d'admission", free: "date" },
        ];
        return (
          <Svg
            w={w}
            h={h}
            label="Deux fiches de recueil. À éviter : des questions ouvertes, « Antécédents », « Évolution », « Biologie », « Date d'entrée », suivies de pointillés. À préférer : des questions fermées et codées, HTA, diabète et infection du site opératoire à J30 avec les cases oui (1), non (0) et non renseigné ; créatinine à l'admission en µmol/L avec une case non faite ; date d'admission en jour, mois, année."
          >
            {/* Fiche à éviter */}
            <rect
              x={0.5}
              y={0.5}
              width={badW - 1}
              height={badH - 1}
              rx={6}
              className="fill-surface stroke-border"
            />
            <Verdict x={pad + 10} y={pad + 12} ok={false} />
            <Txt x={pad + 28} y={pad + 17} bold>
              Questions ouvertes
            </Txt>
            {bad.map((q, i) => {
              const y = pad + 52 + i * 28;
              const tw = q.length * 6.4;
              return (
                <g key={q}>
                  <Txt x={pad} y={y}>
                    {q}
                  </Txt>
                  {dots(pad + tw + 6, y, badW - pad)}
                </g>
              );
            })}

            {/* Fiche à préférer */}
            <rect
              x={goodX + 0.5}
              y={goodY + 0.5}
              width={goodW - 1}
              height={goodH - 1}
              rx={6}
              className="fill-card stroke-brand"
              strokeWidth={1.5}
            />
            <Verdict x={goodX + pad + 10} y={goodY + pad + 12} ok />
            <Txt x={goodX + pad + 28} y={goodY + pad + 17} bold>
              Questions fermées et codées
            </Txt>
            {good.map((g, i) => {
              const y = goodY + pad + 50 + i * 46;
              const x = goodX + pad;
              return (
                <g key={g.q}>
                  <Txt x={x} y={y} bold size={12.5}>
                    {`${g.q} :`}
                  </Txt>
                  {g.opts && <Options x={x} y={y + 21} items={g.opts} />}
                  {g.free === "creat" && (
                    <g>
                      {dots(x, y + 21, x + 60)}
                      <Txt x={x + 66} y={y + 21} size={12.5}>
                        µmol/L
                      </Txt>
                      <Options x={x + 124} y={y + 21} items={["non faite"]} />
                    </g>
                  )}
                  {g.free === "date" && (
                    <Txt x={x} y={y + 21} size={12.5} tone="muted">
                      __ __ / __ __ / __ __ __ __
                    </Txt>
                  )}
                </g>
              );
            })}
          </Svg>
        );
      }}
    />
  );
}
