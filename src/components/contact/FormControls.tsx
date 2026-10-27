import { useId, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ServiceOffer = {
  id: string;
  /** Numéro des trois formules ; les services complémentaires portent une étiquette. */
  number?: number;
  tag?: string;
  name: string;
  price: string;
  delay: string;
};

// Indicatifs proposés (Tunisie en tête).
const COUNTRY_CODES = [
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "+237", flag: "🇨🇲", name: "Cameroun" },
  { code: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "+224", flag: "🇬🇳", name: "Guinée" },
  { code: "+227", flag: "🇳🇪", name: "Niger" },
] as const;

export const DEFAULT_DIAL_CODE = "+216";

/** Ne garde que les chiffres du numéro local (12 max). */
function toLocalDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 12);
}

/**
 * Sélecteur d'indicatif (drapeaux) + numéro local, contrôlé par le parent.
 * `name` est posé sur le champ du numéro (formulaires contrôlés).
 */
export function PhoneInputGroup({
  id,
  name,
  required,
  dialCode,
  onDialCodeChange,
  digits,
  onDigitsChange,
  invalid,
}: {
  id: string;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  dialCode: string;
  onDialCodeChange: (code: string) => void;
  digits: string;
  onDigitsChange: (digits: string) => void;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <Select value={dialCode} onValueChange={onDialCodeChange}>
        <SelectTrigger
          aria-label="Indicatif pays"
          className="h-11 w-auto min-w-[5.25rem] shrink-0 gap-1.5 whitespace-nowrap rounded-none border-0 border-r border-input bg-surface/60 px-3 text-sm font-medium text-foreground/80 shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:line-clamp-none [&>span]:overflow-visible"
        >
          <SelectValue aria-label={dialCode}>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden className="text-base leading-none">
                {COUNTRY_CODES.find((c) => c.code === dialCode)?.flag}
              </span>
              {dialCode}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-base leading-none">
                  {c.flag}
                </span>
                <span className="font-medium">{c.code}</span>
                <span className="text-xs text-muted-foreground">{c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        maxLength={12}
        placeholder="Numéro local"
        value={digits}
        onChange={(e) => onDigitsChange(toLocalDigits(e.target.value))}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className="h-11 w-full min-w-0 flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

/**
 * Champ téléphone autonome pour formulaire non contrôlé (lu via FormData) :
 * émet la valeur complète « +216 12345678 » dans un input caché `name`.
 */
export function PhoneField({
  id = "phone",
  name = "phone",
  required,
  hint,
}: {
  id?: string;
  name?: string;
  required?: boolean;
  hint?: string;
}) {
  const [dialCode, setDialCode] = useState<string>(DEFAULT_DIAL_CODE);
  const [digits, setDigits] = useState("");
  return (
    <Field id={id} label="Téléphone" required={required} hint={hint}>
      <PhoneInputGroup
        id={id}
        required={required}
        dialCode={dialCode}
        onDialCodeChange={setDialCode}
        digits={digits}
        onDigitsChange={setDigits}
      />
      <input type="hidden" name={name} value={digits ? `${dialCode} ${digits}` : ""} />
    </Field>
  );
}

export function SuccessState({ onReset }: { onReset: () => void }) {
  const steps = [
    "Nous vous appelons sous 48 h ouvrées pour comprendre votre projet.",
    "Nous fixons ensemble le travail à faire, le délai et le prix.",
    "Nous démarrons dès votre accord et le règlement.",
  ];
  return (
    <div role="status" className="flex flex-col items-start gap-5">
      <CheckCircle2 className="h-8 w-8 text-brand" aria-hidden />
      <div>
        <h2 className="font-display text-4xl">Message bien reçu, merci.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Voici la suite :</p>
      </div>
      <ol className="w-full space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 border-b border-border py-3">
            <span aria-hidden className="font-hand text-2xl leading-none text-brand">
              {i + 1}.
            </span>
            <span className="text-sm leading-relaxed text-foreground/90">{s}</span>
          </li>
        ))}
      </ol>
      <Button variant="outline" onClick={onReset}>
        Envoyer un autre message
      </Button>
    </div>
  );
}

export function FormSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="font-hand text-3xl leading-none text-brand">
          {number}.
        </span>
        <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
          {title}
        </h2>
        <div className="h-px flex-1 bg-foreground/20" />
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/** Encart de la colonne latérale : filet supérieur, titre, texte (sans pastille d'icône). */
export function InfoCard({ title, text }: { title: string; text: ReactNode }) {
  return (
    <div className="border-t border-foreground pt-4">
      <h2 className="font-sans text-base font-semibold">{title}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Message d'erreur : le champ doit porter aria-describedby={`${id}-error`}. */
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex h-5 items-center gap-1 leading-none">
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const ratio = len / max;
  return (
    <div
      className={cn(
        "mt-1 text-right text-[11px] tabular-nums text-muted-foreground",
        ratio >= 0.8 && ratio < 1 && "text-brand",
        ratio >= 1 && "text-destructive",
      )}
    >
      {len}/{max}
    </div>
  );
}

export function PillsField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const labelId = useId();
  return (
    <div className="space-y-1.5">
      <Label id={labelId}>{label}</Label>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt)}
              className={cn(
                "min-h-11 rounded-sm border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-foreground bg-highlight text-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OffersField({
  offers,
  value,
  onChange,
}: {
  offers: ServiceOffer[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const labelId = useId();
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Label id={labelId}>Formules qui vous intéressent</Label>
        <span className="text-xs text-muted-foreground">Facultatif, plusieurs choix possibles</span>
      </div>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {offers.map((offer) => {
          const selected = value.includes(offer.id);
          return (
            <button
              key={offer.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(offer.id)}
              className={cn(
                "relative flex h-full flex-col rounded-md border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-foreground bg-card shadow-offset"
                  : "border-input bg-background hover:border-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-sm border-2 transition-colors",
                  selected ? "border-brand bg-brand text-brand-foreground" : "border-input",
                )}
              >
                <Check className={cn("h-3 w-3", !selected && "opacity-0")} strokeWidth={3} />
              </span>
              <span aria-hidden className="font-hand text-2xl leading-none text-brand">
                {offer.number ? `${offer.number}.` : offer.tag}
              </span>
              <span className="mt-1.5 pr-6 text-[15px] font-semibold leading-snug">
                {offer.name}
              </span>
              <span className="mt-auto pt-3 font-display text-3xl leading-none">{offer.price}</span>
              <span className="mt-1 text-xs text-muted-foreground">{offer.delay}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
