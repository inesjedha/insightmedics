import type { ReactNode } from "react";
import { CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ServiceOffer = {
  id: string;
  name: string;
  price: string;
  tier: string;
  featured?: boolean;
};

export function SuccessState({ onReset }: { onReset: () => void }) {
  const steps = [
    "Nous vous appelons sous 48h ouvrées pour cadrer le projet.",
    "Nous validons ensemble le périmètre, le délai et le tarif.",
    "Vous recevez un plan d'action — et nous démarrons.",
  ];
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold tracking-tight">Message envoyé.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Merci. Voici ce qui se passe maintenant :
        </p>
      </div>
      <ol className="w-full space-y-3">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3.5"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 font-display text-xs font-bold text-brand">
              {i + 1}
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
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 font-display text-sm font-bold text-brand">
          {number}
        </span>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground/80">
          {title}
        </h3>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function InfoCard({
  icon,
  title,
  text,
  highlight,
}: {
  icon: ReactNode;
  title: string;
  text: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full items-start gap-3 rounded-2xl border p-4 sm:gap-4 sm:p-5",
        highlight ? "border-brand/30 bg-brand/5" : "border-border bg-surface/60",
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
          highlight ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-sm font-semibold tracking-tight sm:text-base">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
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
    </div>
  );
}

export function IconInput({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      {children}
    </div>
  );
}

export function IconTextarea({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-3 text-muted-foreground">
        {icon}
      </span>
      {children}
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
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div role="radiogroup" className="flex flex-wrap gap-1.5">
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
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface/60 text-muted-foreground hover:border-brand/40 hover:text-foreground",
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
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>Offres qui vous intéressent</Label>
        <span className="text-xs text-muted-foreground">Sélectionnez une ou plusieurs</span>
      </div>
      <div role="group" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => {
          const selected = value.includes(offer.id);
          const accent = offer.featured || offer.id === "audit";
          return (
            <button
              key={offer.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(offer.id)}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-xl border-2 p-4 text-left transition-all",
                selected
                  ? "border-brand bg-brand/5"
                  : "border-border bg-surface/40 hover:border-brand/40",
              )}
            >
              {offer.featured && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand/30"
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
                  selected
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-background",
                )}
              >
                <Check
                  className={cn(
                    "h-3 w-3 transition-opacity",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                  strokeWidth={3}
                />
              </span>
              <span className="flex items-center gap-1.5 pr-8">
                {offer.featured && (
                  <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-foreground">
                    {offer.tier}
                  </span>
                )}
                {!offer.featured && (
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      accent ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    {offer.tier}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "mt-1.5 text-sm font-semibold transition-colors",
                  selected ? "text-brand" : "text-foreground group-hover:text-brand",
                )}
              >
                {offer.name}
              </span>
              <span className="mt-4 text-lg font-bold tabular-nums text-foreground">
                {offer.price}{" "}
                <span className="text-xs font-medium uppercase text-muted-foreground">DT</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
