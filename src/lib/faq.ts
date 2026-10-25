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
    question: "Est-ce que c'est de la triche ?",
    answer:
      "Non. Nous vous accompagnons comme le feraient un biostatisticien et un relecteur : nous réalisons les analyses, structurons et rédigeons avec vous, puis nous vous expliquons chaque résultat. Vous restez l'auteur et le responsable scientifique de votre thèse, et c'est vous qui la soutenez. Vérifiez toujours les règles de votre faculté.",
  },
  {
    question: "Ma base est mal saisie : est-ce un problème ?",
    answer:
      "C'est le cas de la plupart des bases. L'audit gratuit vous montre en quelques minutes ce qui bloque : valeurs impossibles, doublons, données manquantes. Nous corrigeons ensuite ce qui peut l'être et vous disons ce qui doit être complété à la source.",
  },
  {
    question: "Mes données patients sont-elles protégées ?",
    answer:
      "Envoyez une base anonymisée, sans nom ni numéro de dossier. Les colonnes qui pourraient identifier un patient sont détectées et masquées avant tout envoi à l'IA, qui ne voit jamais votre base complète. Vos fichiers sont supprimés automatiquement 30 jours après l'aperçu ou la livraison, et rien n'est réutilisé.",
  },
  {
    question: "Combien de temps faut-il ?",
    answer: `${weeksLabel(analyses.delayWeeks)} pour les analyses et les résultats, ${weeksLabel(discussion.delayWeeks)} pour la discussion, ${weeksLabel(these.delayWeeks)} pour la thèse complète, à partir d'une base exploitable. Votre soutenance approche ? Dites-le dès le premier échange : nous vous disons tout de suite si le délai est tenable.`,
  },
  {
    question: "Quand est-ce que je paie ?",
    answer: `À la livraison, sans acompte. L'aperçu de l'audit est gratuit ; l'audit complet coûte ${FULL_AUDIT_PRICE_LABEL}, et vous ne payez qu'après nous avoir parlé.`,
  },
  {
    question: "Vais-je comprendre ce qui a été fait ?",
    answer:
      "Oui, c'est l'objectif. Nous vous présentons les résultats, répondons à vos questions et vous remettons les scripts d'analyse. Vous pourrez justifier chaque choix devant votre jury.",
  },
  {
    question: "Et si j'ai besoin de corrections ?",
    answer:
      "Des allers-retours de relecture sont inclus dans le périmètre prévu au départ. Un changement de question de recherche ou une refonte complète fait l'objet d'un devis à part.",
  },
  {
    question: "Quels formats acceptez-vous ?",
    answer:
      "SPSS (.sav), Excel (.xlsx, .xls) et CSV pour la base, Word ou PDF pour le protocole. Vous recevez des tableaux et des figures prêts à insérer dans votre manuscrit.",
  },
  {
    question: "Comment se passe la suite, concrètement ?",
    answer:
      "Vous testez votre base gratuitement, puis vous remplissez le formulaire de contact. Nous vous rappelons sous 48 h ouvrées pour cadrer le travail, le délai et le prix. Nous démarrons dès votre accord.",
  },
];
