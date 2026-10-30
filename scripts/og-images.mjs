// Images d'aperçu des liens partagés (WhatsApp, Facebook, LinkedIn, Messenger) : 1200 × 630.
//
// Regénérer après un changement de texte, de prix ou un nouveau guide :
//   NODE_PATH=$(npm root -g) node scripts/og-images.mjs
// (Playwright et Chromium sont ceux de la machine ; rien à installer dans le projet.)
//
// Les textes reprennent ce que le site affiche déjà (offres, test gratuit, guides) : rien
// de plus. Les fichiers vont dans public/og/ ; l'image par défaut reste public/og-image.jpg.

import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Module CommonJS résolu via NODE_PATH (l'import ESM l'ignore).
const { chromium } = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Polices du site, embarquées (une page chargée par setContent ne lit pas les file://).
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, "node_modules/@fontsource", pkg, "files", file)).toString("base64")}`;

const PROOFS = [
  "Médecins et biostatisticiens",
  "Plus de 30 thèses accompagnées",
  "Test de votre base gratuit",
];

/** Une image par page partagée. `visual` : la carte de droite (facultative). */
const IMAGES = [
  {
    out: "og-image.jpg",
    eyebrow: "Thèses · mémoires · articles en médecine",
    title: "Votre thèse de médecine, <em>des statistiques à la soutenance.</em>",
    chips: PROOFS,
    visual: "offer",
  },
  {
    out: "og/audit.jpg",
    eyebrow: "Test gratuit · sans inscription",
    title: "Votre base de thèse est-elle <em>prête pour l'analyse&nbsp;?</em>",
    chips: ["SPSS, Excel ou CSV", "Score sur 100 en quelques minutes", "Gratuit"],
    visual: "score",
  },
  {
    out: "og/tarifs.jpg",
    eyebrow: "Tarifs · prix fixé avant de commencer",
    title: "Des tarifs clairs, <em>en dinars.</em>",
    chips: PROOFS,
    visual: "prices",
  },
  {
    out: "og/rapport.jpg",
    eyebrow: "Rapport privé",
    title: "Audit de la base <em>d'une thèse de médecine</em>",
    chips: ["Lien privé, valable 30 jours", "Médecins et biostatisticiens"],
    visual: "score",
  },
  {
    out: "og/guides/quel-test-statistique-choisir-these-medecine.jpg",
    eyebrow: "Guide · statistiques de thèse",
    title: "Quel test statistique choisir <em>pour votre thèse de médecine&nbsp;?</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/regression-logistique-interpreter-odds-ratio-these.jpg",
    eyebrow: "Guide · statistiques de thèse",
    title: "Régression logistique&nbsp;: <em>interpréter un odds ratio dans votre thèse</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "oddsRatio",
  },
  {
    out: "og/guides/calculer-taille-echantillon-these-medecine.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Calculer la taille d'échantillon <em>de votre thèse de médecine</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/courbe-roc-seuil-optimal-these.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Courbe ROC et seuil optimal&nbsp;: <em>le guide pour votre thèse</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/interpreter-valeur-p-intervalle-confiance-these.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Valeur de p et intervalle de confiance&nbsp;: <em>interpréter sans se tromper</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/preparer-base-donnees-excel-spss-these.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Préparer sa base Excel ou SPSS&nbsp;: <em>les 10 erreurs à éviter</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/etude-retrospective-dossiers-base-donnees-these.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Étude rétrospective&nbsp;: <em>de la fiche papier à une base exploitable</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/rediger-analyse-statistique-materiel-methodes-these.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Rédiger l'«&nbsp;Analyse statistique&nbsp;» <em>de votre Matériel et méthodes</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/presenter-resultats-these-tableaux-figures.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Présenter vos résultats&nbsp;: <em>tableaux et figures aux normes</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides/presentation-soutenance-these-medecine.jpg",
    eyebrow: "Guide · thèse de médecine",
    title: "Réussir votre présentation <em>de soutenance de thèse</em>",
    chips: ["Écrit par des médecins et des biostatisticiens", "Gratuit"],
    visual: "guide",
  },
  {
    out: "og/guides.jpg",
    eyebrow: "Guides gratuits",
    title: "Les statistiques de thèse, <em>expliquées simplement.</em>",
    chips: ["Écrits par des médecins et des biostatisticiens", "Gratuits"],
    visual: "guide",
  },
];

const VISUALS = {
  offer: `
    <div class="card">
      <p class="k">Analyses + résultats rédigés</p>
      <p class="price">500 DT</p>
      <p class="muted">Livré en 1 semaine</p>
      <ul>
        <li>Tests adaptés à votre étude</li>
        <li>Tableaux et figures prêts à insérer</li>
        <li>Relu par un médecin et un biostatisticien</li>
      </ul>
    </div>`,
  score: `
    <div class="card">
      <p class="k">Qualité de votre base</p>
      <p class="score">59<span>/100</span></p>
      <p class="verdict">À corriger avant l'analyse</p>
      <div class="gauge"><i style="width:40%;background:#e06c62"></i><i style="width:20%;background:#f3a73b"></i><i style="width:20%;background:#f7d65a"></i><i style="width:20%;background:#1f3fd1"></i><b style="left:59%"></b></div>
      <div class="tiles"><div><strong>14</strong>saisis deux fois&nbsp;?</div><div><strong>3</strong>points bloquants</div></div>
    </div>`,
  prices: `
    <div class="card">
      <div class="row"><span>Test de votre base</span><strong>Gratuit</strong></div>
      <div class="row"><span>Analyses + résultats</span><strong>500 DT</strong></div>
      <div class="row"><span>Discussion rédigée</span><strong>500 DT</strong></div>
      <div class="row"><span>Thèse complète</span><strong>1 500 DT</strong></div>
    </div>`,
  guide: `
    <div class="card guide">
      <p class="k">Exemple</p>
      <p class="mono">Deux groupes, variable quantitative</p>
      <p class="arrow">↓</p>
      <p class="mono strong">Test t de Student ou Mann-Whitney</p>
      <p class="hand">et pourquoi ce test-là</p>
    </div>`,
  oddsRatio: `
    <div class="card guide">
      <p class="k">Exemple</p>
      <p class="mono">OR = 2,4 [IC 95&nbsp;% 1,3 – 4,5]</p>
      <p class="arrow">↓</p>
      <p class="mono strong">Comment l'écrire dans vos résultats</p>
      <p class="hand">expliqué pas à pas</p>
    </div>`,
};

const html = (img) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face{font-family:IS;src:url(${font("instrument-serif", "instrument-serif-latin-400-normal.woff2")})}
@font-face{font-family:IS;font-style:italic;src:url(${font("instrument-serif", "instrument-serif-latin-400-italic.woff2")})}
@font-face{font-family:HG;font-weight:400;src:url(${font("hanken-grotesk", "hanken-grotesk-latin-400-normal.woff2")})}
@font-face{font-family:HG;font-weight:600;src:url(${font("hanken-grotesk", "hanken-grotesk-latin-600-normal.woff2")})}
@font-face{font-family:HG;font-weight:700;src:url(${font("hanken-grotesk", "hanken-grotesk-latin-700-normal.woff2")})}
@font-face{font-family:CV;font-weight:700;src:url(${font("caveat", "caveat-latin-700-normal.woff2")})}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1200px;height:630px;overflow:hidden;font-family:HG;color:#111827;
  background:#fbfbf9;background-image:linear-gradient(#ececea 1px,transparent 1px),linear-gradient(90deg,#ececea 1px,transparent 1px);background-size:28px 28px}
.wrap{display:flex;height:100%;padding:56px 64px;gap:48px;align-items:center}
.main{flex:1;display:flex;flex-direction:column;height:100%;justify-content:space-between}
.logo{font-family:IS;font-size:40px;letter-spacing:-.5px}
.logo em{color:#1f3fd1}.logo b{color:#1f3fd1}
.eyebrow{font-weight:600;font-size:17px;letter-spacing:.16em;text-transform:uppercase;color:#4b5563;margin-bottom:18px}
h1{font-family:IS;font-weight:400;font-size:${img.title.replace(/<[^>]+>|&nbsp;/g, " ").length > 50 ? 64 : 76}px;line-height:1.04;letter-spacing:-.5px}
h1 em{font-style:italic}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chips span{background:#fff;border:1.5px solid #dfe3f8;border-radius:999px;padding:9px 16px;font-size:18px;font-weight:600;color:#1f2937}
.chips span::before{content:"✓ ";color:#1f3fd1}
.url{font-weight:700;font-size:20px;color:#1f3fd1;margin-top:14px}
.card{width:360px;flex-shrink:0;background:#fff;border:1.5px solid #e5e7eb;border-radius:22px;padding:30px 30px;box-shadow:0 24px 50px -24px rgba(17,24,39,.28)}
.k{font-size:15px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#6b7280}
.price{font-family:IS;font-size:86px;line-height:1;margin-top:10px}
.muted{color:#4b5563;font-size:19px;margin-top:4px}
ul{list-style:none;margin-top:20px;display:grid;gap:10px;font-size:18px}
li::before{content:"✓  ";color:#1f3fd1;font-weight:700}
.score{font-family:IS;font-size:96px;line-height:1;margin-top:8px}.score span{font-size:30px;color:#6b7280;font-family:HG}
.verdict{color:#b45309;font-weight:700;font-size:22px;margin-top:6px}
.gauge{position:relative;display:flex;height:12px;border-radius:99px;overflow:visible;margin-top:18px}
.gauge i{display:block;height:12px}.gauge i:first-child{border-radius:99px 0 0 99px}.gauge i:nth-child(4){border-radius:0 99px 99px 0}
.gauge b{position:absolute;top:-7px;width:7px;height:26px;border-radius:9px;background:#111827;border:2px solid #fff;transform:translateX(-50%)}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}
.tiles div{border:1.5px solid #e5e7eb;border-radius:12px;padding:10px 12px;font-size:15px;color:#4b5563}
.tiles strong{display:block;font-family:IS;font-weight:400;font-size:42px;color:#b42318;line-height:1}
.row{display:flex;justify-content:space-between;align-items:baseline;padding:15px 0;border-bottom:1.5px solid #f0f0f0;font-size:20px}
.row:last-child{border:0}.row strong{font-family:IS;font-weight:400;font-size:34px}
.guide .mono{font-size:21px;margin-top:12px}.guide .strong{font-weight:700;color:#1f3fd1}
.arrow{font-size:28px;color:#9ca3af;margin-top:6px}
.hand{font-family:CV;font-size:28px;color:#1f3fd1;margin-top:16px}
</style></head><body><div class="wrap">
  <div class="main">
    <div class="logo">insight<em>medics</em><b>.</b></div>
    <div><p class="eyebrow">${img.eyebrow}</p><h1>${img.title}</h1></div>
    <div><div class="chips">${img.chips.map((c) => `<span>${c}</span>`).join("")}</div><p class="url">insightmedics.fr</p></div>
  </div>
  ${img.visual ? VISUALS[img.visual] : ""}
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const img of IMAGES) {
  await page.setContent(html(img), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const path = join(root, "public", img.out);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path, type: "jpeg", quality: 88 });
  console.log("ok", img.out);
}
await browser.close();
