import { useCallback, useState } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import type { ClientFiche, Fiche, FicheField, FicheSchema } from "@/lib/api/types";
import { FicheForm } from "./FicheForm";

/** Champs « doctorant » qui relèvent de la commande ou de l'équipe : pas sur le lien
 * étudiant (les fichiers passent par WhatsApp ou mail ; les chapitres suivent l'offre). */
const STUDENT_HIDDEN = new Set(["fichiers", "livrer", "figures.versions", "figures.discussion"]);

/**
 * Sur le lien privé de l'étudiant, une fois l'analyse commandée : la fiche de sa thèse
 * (titre, faculté, objectifs…), qui nous permet de rédiger au format de sa faculté.
 * Il ne voit que ses champs ; l'équipe complète les autres dans l'admin.
 */
export function ThesisFicheCard({
  schema,
  fiche,
  onSave,
}: {
  schema: FicheSchema;
  fiche: ClientFiche;
  onSave: (patch: Fiche) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const visible = useCallback(
    (key: string, field: FicheField) =>
      (field.qui ?? "").startsWith("doctorant") && !STUDENT_HIDDEN.has(key),
    [],
  );

  const save = async (patch: Fiche) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave(patch);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible, réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="fiche-these"
      className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <ClipboardList className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-[999_1_320px] space-y-1">
          <h2 className="text-2xl leading-tight">Parlez-nous de votre thèse.</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Votre analyse est commandée. Ces quelques informations nous permettent de rédiger
            directement au format de votre faculté : plan, titres, tableaux, mise en page. Recopiez
            le titre et les objectifs tels qu'ils figurent sur votre fiche d'inscription. Un doute ?
            Cochez « Je ne sais pas » : nous le vérifierons ensemble, rien ne sera deviné.
          </p>
        </div>
      </div>
      <FicheForm
        schema={schema}
        value={fiche.fiche}
        visible={visible}
        disabled={!fiche.editable}
        saving={saving}
        onSave={save}
      />
      {saved && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Merci, c'est enregistré. Vous pouvez revenir la
          compléter tant que l'analyse n'a pas commencé.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
