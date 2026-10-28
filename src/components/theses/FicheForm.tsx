import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { Fiche, FicheField, FicheSchema } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Formulaire de la fiche de mission d'une thèse, construit à partir du schéma de Dr Hamza
 * (`GET /theses/fiche-schema`) : un champ ajouté au JSON apparaît ici sans code.
 * Utilisé par l'admin (tous les champs) et par l'étudiant sur son lien privé (ses champs).
 */

const UNKNOWN = "je ne sais pas";
const NONE = "__none";
const LONG_TEXT = new Set(["objectifs.principal", "population.criteres", "plan_impose"]);
/** Libellés lisibles des codes du schéma (les valeurs enregistrées restent les codes). */
const VALUE_LABEL: Record<string, string> = {
  FMS: "Sousse (FMS)",
  FMT: "Tunis (FMT)",
  FMM: "Monastir (FMM)",
  FMSf: "Sfax (FMSf)",
  fr: "Français",
  en: "Anglais",
  ar: "Arabe",
  intro: "Introduction",
  mm: "Matériel et méthodes",
  res: "Résultats",
  discussion: "Discussion",
  conclusion: "Conclusion",
  resumes: "Résumés",
};

type Props = {
  schema: FicheSchema;
  value: Fiche;
  /** Champs affichés (l'étudiant ne voit que les siens). */
  visible: (key: string, field: FicheField) => boolean;
  disabled?: boolean;
  saving?: boolean;
  showWho?: boolean;
  onSave: (patch: Fiche) => void;
};

export function FicheForm({ schema, value, visible, disabled, saving, showWho, onSave }: Props) {
  const [draft, setDraft] = useState<Fiche>(value);
  useEffect(() => setDraft(value), [value]);

  const entries = useMemo(
    () => Object.entries(schema.champs).filter(([k, f]) => visible(k, f)),
    [schema, visible],
  );
  const changed = entries
    .map(([k]) => k)
    .filter((k) => JSON.stringify(draft[k] ?? null) !== JSON.stringify(value[k] ?? null));

  const set = (key: string, v: unknown) => setDraft((d) => ({ ...d, [key]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(Object.fromEntries(changed.map((k) => [k, draft[k] ?? null])));
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(([key, field]) => (
          <div
            key={key}
            className={
              LONG_TEXT.has(key) || field.type === "liste_objets" || field.type === "objet"
                ? "space-y-1.5 md:col-span-2"
                : "space-y-1.5"
            }
          >
            <label htmlFor={`fiche-${key}`} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-medium">
                {field.libelle}
                {field.obligatoire && <span className="text-destructive"> *</span>}
              </span>
              {showWho && field.qui && (
                <span className="text-[11px] text-muted-foreground">{field.qui}</span>
              )}
            </label>
            <FieldInput
              key={JSON.stringify(value[key] ?? null)}
              id={`fiche-${key}`}
              name={key}
              field={field}
              value={draft[key]}
              disabled={disabled}
              onChange={(v) => set(key, v)}
            />
            {field.note && <p className="text-xs text-muted-foreground">{field.note}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled || saving || !changed.length}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer la fiche
        </Button>
        {!!changed.length && (
          <span className="text-xs text-muted-foreground">
            {changed.length} champ{changed.length > 1 ? "s" : ""} modifié
            {changed.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </form>
  );
}

function FieldInput({
  id,
  name,
  field,
  value,
  disabled,
  onChange,
}: {
  id: string;
  name: string;
  field: FicheField;
  value: unknown;
  disabled?: boolean;
  onChange: (v: unknown) => void;
}) {
  const unknownAllowed =
    !field.obligatoire && ["texte", "entier", "choix_plus_texte"].includes(field.type);
  const isUnknown = value === UNKNOWN;
  const unknownToggle = unknownAllowed && (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Checkbox
        checked={isUnknown}
        disabled={disabled}
        onCheckedChange={(c) => onChange(c === true ? UNKNOWN : "")}
      />
      Je ne sais pas
    </label>
  );
  if (isUnknown) return unknownToggle;

  switch (field.type) {
    case "choix":
      return (
        <Select
          value={typeof value === "string" && value ? value : NONE}
          onValueChange={(v) => onChange(v === NONE ? "" : v)}
          disabled={disabled}
        >
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>
              {field.defaut ? `Par défaut (${String(field.defaut)})` : "—"}
            </SelectItem>
            {(field.valeurs ?? []).map((v) => (
              <SelectItem key={v} value={v}>
                {VALUE_LABEL[v] ?? v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "choix_multiple": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-3">
          {(field.valeurs ?? []).map((v) => (
            <label key={v} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={selected.includes(v)}
                disabled={disabled}
                onCheckedChange={(c) =>
                  onChange(c === true ? [...selected, v] : selected.filter((x) => x !== v))
                }
              />
              {VALUE_LABEL[v] ?? v}
            </label>
          ))}
        </div>
      );
    }
    case "booléen":
      return (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            id={id}
            checked={value === true}
            disabled={disabled}
            onCheckedChange={(c) => onChange(c === true)}
          />
          Oui
        </label>
      );
    case "entier":
      return (
        <div className="space-y-1">
          <Input
            id={id}
            type="number"
            min={0}
            value={typeof value === "number" ? value : ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
          {unknownToggle}
        </div>
      );
    case "liste":
    case "liste_fichiers":
      return (
        <LinesTextarea
          id={id}
          placeholder={field.attendus ? field.attendus.join("\n") : "Un élément par ligne"}
          initial={Array.isArray(value) ? (value as string[]).join("\n") : ""}
          disabled={disabled}
          onLines={onChange}
        />
      );
    case "objet": {
      const obj = (value && typeof value === "object" ? value : {}) as Record<string, string>;
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.sous_champs ?? []).map((sub) => (
            <Input
              key={sub}
              aria-label={`${field.libelle} : ${sub}`}
              placeholder={sub}
              value={obj[sub] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(clean({ ...obj, [sub]: e.target.value }))}
            />
          ))}
        </div>
      );
    }
    case "liste_objets": {
      const subs = field.sous_champs ?? [];
      const items = Array.isArray(value) ? (value as Record<string, string>[]) : [];
      return (
        <LinesTextarea
          id={id}
          placeholder={`Une ligne par élément : ${subs.join(" ; ")}`}
          initial={items.map((it) => subs.map((s) => it[s] ?? "").join(" ; ")).join("\n")}
          disabled={disabled}
          onLines={(rows) =>
            onChange(
              rows.map((line) => {
                const parts = line.split(";").map((p) => p.trim());
                return clean(Object.fromEntries(subs.map((s, i) => [s, parts[i] ?? ""])));
              }),
            )
          }
        />
      );
    }
    default: {
      const text = typeof value === "string" ? value : "";
      const listId = field.type === "choix_plus_texte" ? `${id}-choix` : undefined;
      return (
        <div className="space-y-1">
          {LONG_TEXT.has(name) ? (
            <Textarea
              id={id}
              rows={2}
              value={text}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <Input
              id={id}
              list={listId}
              value={text}
              placeholder={field.defaut ? `Par défaut : ${String(field.defaut)}` : undefined}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
          {listId && (
            <datalist id={listId}>
              {(field.valeurs ?? []).map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          )}
          {unknownToggle}
        </div>
      );
    }
  }
}

/** Zone de texte « une ligne par élément » : le texte saisi reste tel quel (retours à la
 * ligne compris), la valeur envoyée est la liste des lignes non vides. */
function LinesTextarea({
  id,
  initial,
  placeholder,
  disabled,
  onLines,
}: {
  id: string;
  initial: string;
  placeholder: string;
  disabled?: boolean;
  onLines: (rows: string[]) => void;
}) {
  // Initialisé au montage ; le formulaire remonte le champ quand la fiche enregistrée change.
  const [text, setText] = useState(initial);
  return (
    <Textarea
      id={id}
      rows={3}
      placeholder={placeholder}
      value={text}
      disabled={disabled}
      onChange={(e) => {
        setText(e.target.value);
        onLines(lines(e.target.value));
      }}
    />
  );
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function clean(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ""));
}
