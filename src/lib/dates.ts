export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";

/** « aujourd'hui », « il y a 3 j », « dans 2 j » : plus parlant qu'une date dans un CRM. */
export function relativeDay(iso: string): string {
  const day = 86_400_000;
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(new Date(iso)) - start(new Date())) / day);
  if (diff === 0) return "aujourd'hui";
  if (diff === -1) return "hier";
  if (diff === 1) return "demain";
  return diff < 0 ? `il y a ${-diff} j` : `dans ${diff} j`;
}
