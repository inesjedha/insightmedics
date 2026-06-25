import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import {
  Mail,
  Send,
  CheckCircle2,
  Phone,
  Clock,
  User,
  FileText,
  Target,
  HelpCircle,
  MessageSquare,
  Loader2,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { siteConfig } from "@/lib/site-config";
import { createLead } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Insight Medics" },
      {
        name: "description",
        content:
          "Décrivez votre projet de thèse ou de publication. Réponse sous 48h.",
      },
      { property: "og:title", content: "Contact — Insight Medics" },
      {
        property: "og:description",
        content:
          "Réponse sous 48h. Décrivez votre projet et nous revenons vers vous.",
      },
    ],
  }),
  component: ContactPage,
});

const phoneLocalRegex = /^\d{6,12}$/;

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

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z
    .string()
    .trim()
    .regex(phoneLocalRegex, "Numéro à 6-12 chiffres requis"),
  subject: z.string().trim().min(3, "Sujet trop court").max(150, "Sujet trop long"),
  problem: z
    .string()
    .trim()
    .min(10, "Décrivez votre problématique (min. 10 caractères)")
    .max(1000, "Trop long (max. 1000 caractères)"),
  objective: z
    .string()
    .trim()
    .min(10, "Décrivez votre objectif (min. 10 caractères)")
    .max(1000, "Trop long (max. 1000 caractères)"),
  message: z
    .string()
    .trim()
    .max(2000, "Message trop long (max. 2000 caractères)")
    .optional()
    .or(z.literal("")),
});

type ContactValues = z.infer<typeof contactSchema>;
type FieldName = keyof ContactValues;
type FieldErrors = Partial<Record<FieldName, string>>;

type ServiceOffer = {
  id: string;
  name: string;
  price: string;
  tier: string;
  featured?: boolean;
};

const SERVICE_OFFERS: ServiceOffer[] = [
  { id: "analyses", name: "Analyses + résultats", price: "500", tier: "Essentiel" },
  { id: "discussion", name: "Discussion", price: "500", tier: "Expertise" },
  { id: "imrad", name: "IMRAD complet", price: "1 200", tier: "Le plus choisi", featured: true },
];

const URGENCIES = [
  "< 2 semaines",
  "2-4 semaines",
  "> 1 mois",
  "Pas de deadline",
] as const;

const SUBJECT_EXAMPLES = [
  "Thèse rétrospective en cardiologie",
  "Étude de cohorte sur le diabète",
  "Revue systématique",
];

const INITIAL_VALUES: Record<FieldName, string> = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  problem: "",
  objective: "",
  message: "",
};

function ContactPage() {
  const [values, setValues] = useState<Record<FieldName, string>>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<string>("2-4 semaines");
  const [dialCode, setDialCode] = useState<string>("+216");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setValue = (name: FieldName, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const setPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    setValue("phone", digits);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as FieldName;
        if (!fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      setShowErrorBanner(true);
      const firstError = Object.keys(fe)[0];
      if (firstError) {
        const el = formRef.current?.querySelector<HTMLElement>(
          `[name="${firstError}"]`
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el?.focus(), 300);
      }
      return;
    }
    setErrors({});
    setShowErrorBanner(false);
    setSubmitting(true);
    const offersLabel = selectedOffers
      .map((id) => SERVICE_OFFERS.find((o) => o.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    const metaParts = [
      offersLabel ? `Offres : ${offersLabel}` : null,
      `Délai : ${urgency}`,
    ].filter(Boolean);
    const meta = metaParts.join(" | ");
    const finalMessage = parsed.data.message
      ? `${meta}\n${parsed.data.message}`
      : meta;
    try {
      await createLead({
        source: "contact",
        name: parsed.data.name,
        email: parsed.data.email,
        phone: `${dialCode} ${parsed.data.phone}`,
        subject: parsed.data.subject,
        problem: parsed.data.problem,
        objective: parsed.data.objective,
        message: finalMessage,
      });
      setSubmitted(true);
      setValues(INITIAL_VALUES);
      setSelectedOffers([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Parlons de <span className="text-brand">votre projet</span>.
          </>
        }
        description="Décrivez votre étude, votre problématique et votre objectif. Nous revenons vers vous sous 48h ouvrées — par téléphone en priorité."
      />

      <Section className="pt-4 sm:pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-brand/5 via-transparent to-transparent"
            />
            <div className="relative">
              {submitted ? (
                <SuccessState onReset={() => setSubmitted(false)} />
              ) : (
                <form
                  ref={formRef}
                  onSubmit={onSubmit}
                  className="space-y-8"
                  noValidate
                >
                  <p className="text-xs text-muted-foreground">
                    Les champs marqués d'un{" "}
                    <span className="text-destructive">*</span> sont obligatoires.
                  </p>

                  {showErrorBanner && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Merci de compléter les champs obligatoires avant l'envoi.
                      </span>
                    </div>
                  )}

                  <FormSection number="01" title="Vos coordonnées">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field id="name" label="Nom complet" required>
                        <IconInput icon={<User className="h-4 w-4" />}>
                          <Input
                            id="name"
                            name="name"
                            autoComplete="name"
                            required
                            maxLength={100}
                            value={values.name}
                            onChange={(e) => setValue("name", e.target.value)}
                            className="h-11 pl-10 transition-colors"
                            placeholder="Ibn Sina"
                          />
                        </IconInput>
                      </Field>
                      <Field
                        id="phone"
                        label="Téléphone"
                        required
                        hint="Prioritaire pour vous recontacter"
                      >
                        <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                          <Select value={dialCode} onValueChange={setDialCode}>
                            <SelectTrigger
                              aria-label="Indicatif pays"
                              className="h-11 w-auto min-w-[5.75rem] shrink-0 gap-1.5 whitespace-nowrap rounded-none border-0 border-r border-input bg-surface/60 px-3 text-sm font-medium text-foreground/80 shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:line-clamp-none [&>span]:overflow-visible"
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
                                    <span className="text-xs text-muted-foreground">
                                      {c.name}
                                    </span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            required
                            maxLength={12}
                            placeholder="Numéro local"
                            value={values.phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11 flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      </Field>
                    </div>
                    <Field id="email" label="Email" required>
                      <IconInput icon={<Mail className="h-4 w-4" />}>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={255}
                          placeholder="vous@exemple.tn"
                          value={values.email}
                          onChange={(e) => setValue("email", e.target.value)}
                          className="h-11 pl-10 transition-colors"
                        />
                      </IconInput>
                    </Field>
                  </FormSection>

                  <FormSection number="02" title="Sujet de votre étude">
                    <Field id="subject" label="Sujet" required>
                      <IconInput icon={<FileText className="h-4 w-4" />}>
                        <Input
                          id="subject"
                          name="subject"
                          required
                          maxLength={150}
                          placeholder="Ex. Thèse sur la prise en charge de l'infarctus aux urgences"
                          value={values.subject}
                          onChange={(e) => setValue("subject", e.target.value)}
                          className="h-11 pl-10 transition-colors"
                        />
                      </IconInput>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Inspirations :
                        </span>
                        {SUBJECT_EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setValue("subject", ex)}
                            className="rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <OffersField
                      value={selectedOffers}
                      onChange={setSelectedOffers}
                    />

                    <PillsField
                      label="Délai souhaité"
                      options={[...URGENCIES]}
                      value={urgency}
                      onChange={setUrgency}
                    />
                  </FormSection>

                  <FormSection number="03" title="Problématique & objectif">
                    <Field
                      id="problem"
                      label="Problématique"
                      required
                      hint="Ce que vous cherchez à comprendre"
                    >
                      <IconTextarea icon={<HelpCircle className="h-4 w-4" />}>
                        <Textarea
                          id="problem"
                          name="problem"
                          rows={4}
                          required
                          maxLength={1000}
                          placeholder="Quel est le problème clinique ou scientifique abordé ?"
                          value={values.problem}
                          onChange={(e) => setValue("problem", e.target.value)}
                          className="resize-none pl-10 pt-3 transition-colors"
                        />
                      </IconTextarea>
                      <CharCount value={values.problem} max={1000} />
                    </Field>
                    <Field
                      id="objective"
                      label="Objectif"
                      required
                      hint="Le livrable attendu (thèse complète, chapitre stats, article…)"
                    >
                      <IconTextarea icon={<Target className="h-4 w-4" />}>
                        <Textarea
                          id="objective"
                          name="objective"
                          rows={4}
                          required
                          maxLength={1000}
                          placeholder="Quel résultat / livrable cherchez-vous ?"
                          value={values.objective}
                          onChange={(e) => setValue("objective", e.target.value)}
                          className="resize-none pl-10 pt-3 transition-colors"
                        />
                      </IconTextarea>
                      <CharCount value={values.objective} max={1000} />
                    </Field>
                  </FormSection>

                  <FormSection number="04" title="Message complémentaire">
                    <Field id="message" label="Optionnel">
                      <IconTextarea icon={<MessageSquare className="h-4 w-4" />}>
                        <Textarea
                          id="message"
                          name="message"
                          rows={4}
                          maxLength={2000}
                          placeholder="Deadline précise, état actuel de la base, points particuliers…"
                          value={values.message}
                          onChange={(e) => setValue("message", e.target.value)}
                          className="resize-none pl-10 pt-3 transition-colors"
                        />
                      </IconTextarea>
                      <CharCount value={values.message} max={2000} />
                    </Field>
                  </FormSection>

                  <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      En envoyant ce message, vous acceptez d'être recontacté(e)
                      par téléphone ou email.
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="group w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi…
                        </>
                      ) : (
                        <>
                          Envoyer
                          <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-2 text-xs font-medium text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Réponse sous 48h ouvrées
            </div>
            <InfoCard
              icon={<Phone className="h-4 w-4 sm:h-5 sm:w-5" />}
              title="Téléphone prioritaire"
              text="Nous rappelons par téléphone en priorité. Indiquez un numéro joignable dans le formulaire."
            />
            <InfoCard
              icon={<Mail className="h-4 w-4 sm:h-5 sm:w-5" />}
              title="Email direct"
              text={
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-foreground hover:text-brand"
                >
                  {siteConfig.email}
                </a>
              }
            />
            <InfoCard
              icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
              title="Délais de réponse"
              text="Réponse sous 48h ouvrées. Pour les soutenances imminentes, signalez-le dès le premier message — nous traitons en priorité."
            />
            <InfoCard
              icon={<User className="h-4 w-4 sm:h-5 sm:w-5" />}
              title="Basé à Sousse, Tunisie"
              text="Équipe biostatisticien + médecin disponible pour vos thèses et publications."
            />
          </aside>
        </div>
      </Section>

      <FinalCTA
        title="Vous préférez voir avant de discuter ?"
        description="Lancez l'audit gratuit de votre base. Vous recevez un rapport clair sur l'état de vos données — et un aperçu concret de notre méthode."
        primary={{ to: "/audit", label: "Lancer un audit gratuit" }}
        secondary={{ to: "/methode", label: "Voir notre méthode" }}
      />
    </SiteLayout>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
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
        <h3 className="font-display text-xl font-bold tracking-tight">
          Message envoyé.
        </h3>
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
            <span className="text-sm leading-relaxed text-foreground/90">
              {s}
            </span>
          </li>
        ))}
      </ol>
      <Button variant="outline" onClick={onReset}>
        Envoyer un autre message
      </Button>
    </div>
  );
}

function FormSection({
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

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:gap-4 sm:p-5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:h-10 sm:w-10">
        {icon}
      </span>
      <div>
        <h3 className="font-display text-sm font-semibold tracking-tight sm:text-base">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}

function Field({
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
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && (
            <span aria-hidden className="text-destructive">
              *
            </span>
          )}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function IconInput({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      {children}
    </div>
  );
}

function IconTextarea({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-3 text-muted-foreground">
        {icon}
      </span>
      {children}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const ratio = len / max;
  return (
    <div
      className={cn(
        "mt-1 text-right text-[11px] tabular-nums text-muted-foreground",
        ratio >= 0.8 && ratio < 1 && "text-brand",
        ratio >= 1 && "text-destructive"
      )}
    >
      {len}/{max}
    </div>
  );
}

function PillsField({
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
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selected
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface/60 text-muted-foreground hover:border-brand/40 hover:text-foreground"
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

function OffersField({
  value,
  onChange,
}: {
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
        <span className="text-xs text-muted-foreground">
          Sélectionnez une ou plusieurs
        </span>
      </div>
      <div role="group" className="grid gap-3 sm:grid-cols-2">
        {SERVICE_OFFERS.map((offer) => {
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
                  : "border-border bg-surface/40 hover:border-brand/40"
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
                    : "border-border bg-background"
                )}
              >
                <Check
                  className={cn(
                    "h-3 w-3 transition-opacity",
                    selected ? "opacity-100" : "opacity-0"
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
                      accent ? "text-brand" : "text-muted-foreground"
                    )}
                  >
                    {offer.tier}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "mt-1.5 text-sm font-semibold transition-colors",
                  selected ? "text-brand" : "text-foreground group-hover:text-brand"
                )}
              >
                {offer.name}
              </span>
              <span className="mt-4 text-lg font-bold tabular-nums text-foreground">
                {offer.price}{" "}
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  DT
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
