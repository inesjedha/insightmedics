import { FULL_AUDIT_PRICE_LABEL, getOffer, weeksLabel } from "@/lib/offers";

type FaqItem = { question: string; answer: string };

const analyses = getOffer("analyses");
const discussion = getOffer("discussion");
const these = getOffer("these");

/**
 * Questions fréquentes, tirées des objections des étudiants. Chaque réponse ne
 * reprend que des faits vérifiables (offres, CGV, politique de confidentialité).
 */
export const FAQ: FaqItem[] = [
  {
    question: "Est-ce que c'est de la triche ?",
    answer:
      "Non, si l'accompagnement est fait comme il se doit. Faire appel à un biostatisticien est courant en recherche clinique : les CHU ont des services d'épidémiologie pour cela. Nous réalisons les analyses et rédigeons avec vous ; vous gardez la main sur la question, les choix et le texte final, et vous savez expliquer chaque résultat. Vérifiez les règles de votre faculté sur l'aide extérieure, et mentionnez-la si elles le demandent.",
  },
  {
    question: "Ma base est mal saisie : est-ce un problème ?",
    answer:
      "C'est le cas de la plupart des bases. Le test gratuit vous montre en quelques minutes ce qui bloque : données manquantes, doublons, codes « 999 » non déclarés. Nous corrigeons ensuite ce qui peut l'être et vous disons ce qui doit être complété à la source.",
  },
  {
    question: "Mes données patients sont-elles protégées ?",
    answer:
      "Envoyez une base anonymisée, sans nom ni numéro de dossier. Les colonnes nominatives (nom, téléphone, e-mail, adresse, CIN, date de naissance) sont repérées et masquées avant tout envoi à l'IA, qui ne voit qu'un extrait de 50 lignes au plus. Vos fichiers sont supprimés automatiquement 30 jours après le test ou la livraison, et rien n'est réutilisé.",
  },
  {
    question: "Combien de temps faut-il ?",
    answer: `${weeksLabel(analyses.delayWeeks)} pour les analyses et les résultats, ${weeksLabel(discussion.delayWeeks)} pour la discussion, ${weeksLabel(these.delayWeeks)} pour la thèse complète, à partir d'une base exploitable. Votre soutenance approche ? Indiquez sa date : nous vous dirons dès le premier appel si le délai est tenable.`,
  },
  {
    question: "Quand est-ce que je paie ?",
    answer: `Les formules se paient à la livraison, sans acompte. Le test de votre base est gratuit. L'audit complet (${FULL_AUDIT_PRICE_LABEL}) se règle après un appel avec nous, avant son lancement.`,
  },
  {
    question: "Vais-je comprendre ce qui a été fait ?",
    answer:
      "Oui, c'est l'objectif. Nous vous présentons les résultats, répondons à vos questions et vous expliquons chaque choix de méthode : vous pourrez les justifier devant votre jury.",
  },
  {
    question: "Et si mes résultats ne sont pas significatifs ?",
    answer:
      "C'est un résultat, pas un échec. Nous l'analysons et le discutons honnêtement avec vous : puissance, taille de l'échantillon, limites de l'étude. Nous ne cherchons jamais à forcer un résultat.",
  },
  {
    question: "Et si j'ai besoin de corrections ?",
    answer:
      "Des allers-retours de relecture sont inclus dans le périmètre prévu au départ. Un changement de question de recherche ou une refonte complète fait l'objet d'un devis à part.",
  },
  {
    question: "Quels formats acceptez-vous ?",
    answer:
      "SPSS (.sav), Excel (.xlsx, .xls) et CSV pour la base, Word (.docx), PDF ou texte (.txt) pour le protocole. Vous recevez des tableaux et des figures prêts à insérer dans votre manuscrit.",
  },
  {
    question: "Comment se passe la suite, concrètement ?",
    answer:
      "Vous testez votre base gratuitement, puis vous remplissez le formulaire de contact. Nous vous rappelons sous 48 h ouvrées pour cadrer le travail, le délai et le prix. Nous démarrons dès votre accord.",
  },
];
