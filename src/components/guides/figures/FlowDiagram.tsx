import { Arrow, Box, Responsive, Svg, Txt, Verdict } from "@/components/guides/figures/chart";
import { NARROW, small } from "@/components/guides/figures/scale";

/**
 * Diagrammes en boîtes : diagramme de flux d'une étude rétrospective, et carte de cohérence
 * entre la partie « Analyse statistique » du M&M et les Résultats.
 */

/** Diagramme de flux de l'exemple fictif : 412 identifiés, 80 exclus, 332 analysés. */
export function RetroFlow() {
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        // Colonne principale et colonne des exclusions
        const mx0 = narrow ? 0 : 10;
        const mx1 = narrow ? w : 330;
        const spine = narrow ? 18 : (mx0 + mx1) / 2;
        const ex0 = narrow ? 40 : 356;
        const ex1 = w;
        const aY = 0;
        const aH = 70;
        const exY = aY + aH + 24;
        const exLines = [
          "Exclus : n = 80",
          "• dossier introuvable : 37",
          "• non-inclusion (opéré dans",
          "\u00a0\u00a0\u00a0un autre centre) : 25",
          "• critère de jugement principal",
          "\u00a0\u00a0\u00a0non renseigné : 18",
        ];
        const exH = exLines.length * 17 + 18;
        const bY = exY + exH + 24;
        const bH = 54;
        const cY = bY + bH + 40;
        const cH = 54;
        const gap = 8;
        const cw = (mx1 - mx0 - gap) / 2;
        const branchY = exY + exH / 2;
        const h = cY + cH + 2;
        return (
          <Svg
            w={w}
            h={h}
            label="Diagramme de flux : 412 patients identifiés dans le registre du bloc opératoire de 2021 à 2023 ; 80 exclus, dont 37 dossiers introuvables, 25 critères de non-inclusion (opérés dans un autre centre) et 18 critères de jugement principal non renseignés ; 332 patients inclus et analysés, dont 214 opérés en urgence (64,5 %) et 118 en chirurgie programmée (35,5 %)."
          >
            <Box
              x={mx0}
              y={aY}
              w={mx1 - mx0}
              h={aH}
              lines={[
                "Patients identifiés dans le registre",
                "du bloc opératoire (2021–2023)",
                "n = 412",
              ]}
              boldLast
            />
            {/* Tronc et dérivation vers les exclusions */}
            <line
              x1={spine}
              x2={spine}
              y1={aY + aH}
              y2={bY - 2}
              strokeWidth={1.5}
              className="stroke-muted-foreground"
            />
            <Arrow x1={spine} y1={bY - 12} x2={spine} y2={bY - 2} />
            <Arrow x1={spine} y1={branchY} x2={ex0 - 2} y2={branchY} />
            <Box
              x={ex0}
              y={exY}
              w={ex1 - ex0}
              h={exH}
              lines={exLines}
              align="start"
              boldFirst
              title="Exclus : 37 + 25 + 18 = 80"
            />
            <Box
              x={mx0}
              y={bY}
              w={mx1 - mx0}
              h={bH}
              lines={["Patients inclus et analysés", "n = 332"]}
              strong
              boldLast
              title="412 − 80 = 332"
            />
            {/* Répartition */}
            <line
              x1={(mx0 + mx1) / 2}
              x2={(mx0 + mx1) / 2}
              y1={bY + bH}
              y2={bY + bH + 18}
              strokeWidth={1.5}
              className="stroke-muted-foreground"
            />
            <line
              x1={mx0 + cw / 2}
              x2={mx1 - cw / 2}
              y1={bY + bH + 18}
              y2={bY + bH + 18}
              strokeWidth={1.5}
              className="stroke-muted-foreground"
            />
            <Arrow x1={mx0 + cw / 2} y1={bY + bH + 18} x2={mx0 + cw / 2} y2={cY - 2} />
            <Arrow x1={mx1 - cw / 2} y1={bY + bH + 18} x2={mx1 - cw / 2} y2={cY - 2} />
            <Box
              x={mx0}
              y={cY}
              w={cw}
              h={cH}
              lines={["Chirurgie en urgence", "214 (64,5 %)"]}
              boldLast
            />
            <Box
              x={mx0 + cw + gap}
              y={cY}
              w={cw}
              h={cH}
              lines={["Chirurgie programmée", "118 (35,5 %)"]}
              boldLast
            />
          </Svg>
        );
      }}
    />
  );
}

type Pair = { left: string[] | null; right: string[] | null; leftN?: string[]; rightN?: string[] };

/** Chaque méthode annoncée a son résultat, chaque résultat a sa méthode. */
export function CoherenceMap() {
  const pairs: Pair[] = [
    {
      left: ["Moyenne ± écart-type ou", "médiane [Q1–Q3] ; n (%)"],
      leftN: ["Moyenne ± écart-type", "ou médiane [Q1–Q3] ;", "n (%)"],
      right: ["Analyse descriptive", "Qui sont les patients ?"],
      rightN: ["Analyse", "descriptive"],
    },
    {
      left: ["Proportion et IC 95 %", "(méthode de Wilson)"],
      leftN: ["Proportion et IC 95 %", "(Wilson)"],
      right: ["Objectif principal", "Fréquence des complications"],
      rightN: ["Objectif principal"],
    },
    {
      left: ["Chi², Fisher, Student,", "Mann-Whitney ; OR et IC 95 %"],
      leftN: ["Chi², Fisher, Student,", "Mann-Whitney ;", "OR et IC 95 %"],
      right: ["Facteurs associés", "Comparaisons univariées"],
      rightN: ["Facteurs associés"],
    },
    {
      left: ["Régression logistique binaire ;", "ORa, IC 95 %, Hosmer-Lemeshow"],
      leftN: ["Régression logistique", "binaire ; ORa et IC 95 % ;", "Hosmer-Lemeshow"],
      right: ["Analyse multivariée", "Facteurs après ajustement"],
      rightN: ["Analyse", "multivariée"],
    },
    { left: ["Kaplan-Meier annoncé"], right: null },
    { left: null, right: ["Modèle qui surgit", "sans avoir été décrit"] },
  ];
  return (
    <Responsive
      render={(w) => {
        const narrow = w === NARROW;
        const colW = narrow ? 148 : 236;
        const lx = 0;
        const rx = w - colW;
        const top = 30;
        const lh = 16;
        const rows = pairs.map((p) => {
          const l = narrow ? (p.leftN ?? p.left) : p.left;
          const r = narrow ? (p.rightN ?? p.right) : p.right;
          const n = Math.max(l?.length ?? 1, r?.length ?? 1);
          return { l, r, h: n * lh + 20 };
        });
        let y = top;
        const placed = rows.map((r, i) => {
          if (i === 4) y += 22;
          const y0 = y;
          y += r.h + 10;
          return { ...r, y0 };
        });
        const h = y + 4;
        const midX = (lx + colW + rx) / 2;
        return (
          <Svg
            w={w}
            h={h}
            label="Correspondance entre la partie Analyse statistique du Matériel et méthodes et les Résultats. Description des variables pour l'analyse descriptive ; proportion et IC 95 % de Wilson pour l'objectif principal ; Chi², Fisher, Student, Mann-Whitney, OR et IC 95 % pour les facteurs associés ; régression logistique binaire, ORa, IC 95 % et Hosmer-Lemeshow pour l'analyse multivariée. À éviter : un Kaplan-Meier annoncé et jamais montré, un modèle présent dans les Résultats sans avoir été décrit."
          >
            <Txt x={lx} y={14} bold size={narrow ? 12.5 : undefined}>
              {narrow ? "M&M : analyse statistique" : "Matériel et méthodes : analyse statistique"}
            </Txt>
            <Txt x={rx} y={14} bold size={narrow ? 12.5 : undefined}>
              Résultats
            </Txt>
            {placed.map((p, i) => {
              const bad = i >= 4;
              const cy = p.y0 + p.h / 2;
              return (
                <g key={i}>
                  {p.l ? (
                    <Box
                      x={lx}
                      y={p.y0}
                      w={colW}
                      h={p.h}
                      lines={p.l}
                      align="start"
                      lh={lh}
                      danger={bad}
                      size={narrow ? 12.5 : undefined}
                      boldFirst={bad}
                    />
                  ) : (
                    <Box
                      x={lx}
                      y={p.y0}
                      w={colW}
                      h={p.h}
                      lines={["Rien d'annoncé"]}
                      dashed
                      danger
                      align="start"
                      size={narrow ? 12.5 : undefined}
                    />
                  )}
                  {p.r ? (
                    <Box
                      x={rx}
                      y={p.y0}
                      w={colW}
                      h={p.h}
                      lines={p.r}
                      align="start"
                      lh={lh}
                      danger={bad}
                      boldFirst
                      size={narrow ? 12.5 : undefined}
                    />
                  ) : (
                    <Box
                      x={rx}
                      y={p.y0}
                      w={colW}
                      h={p.h}
                      lines={["Aucun résultat"]}
                      dashed
                      danger
                      align="start"
                      size={narrow ? 12.5 : undefined}
                    />
                  )}
                  {bad ? (
                    <Verdict x={midX} y={cy} ok={false} />
                  ) : (
                    <g>
                      <line
                        x1={lx + colW + 4}
                        x2={rx - 4}
                        y1={cy}
                        y2={cy}
                        strokeWidth={1.5}
                        className="stroke-brand"
                      />
                      <circle cx={lx + colW + 4} cy={cy} r={3} className="fill-brand" />
                      <circle cx={rx - 4} cy={cy} r={3} className="fill-brand" />
                    </g>
                  )}
                </g>
              );
            })}
            <Txt
              x={lx}
              y={placed[4].y0 - 10}
              tone="muted"
              size={small(narrow)}
              className="uppercase tracking-[0.08em]"
            >
              À éviter
            </Txt>
          </Svg>
        );
      }}
    />
  );
}
