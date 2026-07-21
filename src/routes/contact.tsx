import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  Mail,
  Send,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { HONEYPOT_FIELD, honeypotStyle, isHoneypotTripped, isTooFast } from "@/lib/anti-spam";
import { cn } from "@/lib/utils";
import {
  SuccessState,
  FormSection,
  InfoCard,
  Field,
  IconInput,
  IconTextarea,
  CharCount,
  PillsField,
  OffersField,
  type ServiceOffer,
} from "@/components/contact/FormControls";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Insight Medics" },
      {
        name: "description",
        content: "Décrivez votre projet de thèse ou de publication. Réponse sous 48h.",
      },
      { property: "og:title", content: "Contact — Insight Medics" },
      {
        property: "og:description",
        content: "Réponse sous 48h. Décrivez votre projet et nous revenons vers vous.",
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
  phone: z.string().trim().regex(phoneLocalRegex, "Numéro à 6-12 chiffres requis"),
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

const SERVICE_OFFERS: ServiceOffer[] = [
  { id: "analyses", name: "Analyses + résultats", price: "500", tier: "Essentiel" },
  { id: "discussion", name: "Discussion", price: "500", tier: "Expertise" },
  { id: "imrad", name: "Thèse complète", price: "1 200", tier: "Le plus choisi", featured: true },
];

const URGENCIES = ["< 2 semaines", "2-4 semaines", "> 1 mois", "Pas de deadline"] as const;

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
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mountedAtRef = useRef<number>(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

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
    if (submitting) return;

    // Anti-spam silencieux : honeypot rempli ou form soumis trop vite => faux succès.
    const honeypotValue = (
      formRef.current?.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null
    )?.value;
    if (isHoneypotTripped(honeypotValue) || isTooFast(mountedAtRef.current)) {
      setSubmitted(true);
      return;
    }

    const parsed = contactSchema.safeParse(values);
    const hasFieldErrors = !parsed.success;
    const hasConsentError = !consent;

    if (hasFieldErrors || hasConsentError) {
      const fe: FieldErrors = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const k = issue.path[0] as FieldName;
          if (!fe[k]) fe[k] = issue.message;
        }
      }
      setErrors(fe);
      setConsentError(hasConsentError);
      setShowErrorBanner(true);
      const firstError = Object.keys(fe)[0];
      if (firstError) {
        const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el?.focus(), 300);
      } else if (hasConsentError) {
        const el = formRef.current?.querySelector<HTMLElement>("#contact-consent");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setErrors({});
    setConsentError(false);
    setShowErrorBanner(false);
    setSubmitError(null);
    setSubmitting(true);
    const offersLabel = selectedOffers
      .map((id) => SERVICE_OFFERS.find((o) => o.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    const metaParts = [offersLabel ? `Offres : ${offersLabel}` : null, `Délai : ${urgency}`].filter(
      Boolean,
    );
    const meta = metaParts.join(" | ");
    const finalMessage = parsed.data.message ? `${meta}\n${parsed.data.message}` : meta;
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
      setConsent(false);
    } catch (err) {
      console.error("[contact] submit failed", err);
      setSubmitError(
        "L'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez-nous directement par email.",
      );
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

      <Section className="pt-2 sm:pt-4">
        <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            Réponse sous 48h ouvrées
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            Premier échange gratuit
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10 xl:grid-cols-[1.6fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-brand/5 via-transparent to-transparent"
            />
            <div className="relative p-5 sm:p-8 lg:p-10">
              {submitted ? (
                <SuccessState onReset={() => setSubmitted(false)} />
              ) : (
                <form
                  ref={formRef}
                  onSubmit={onSubmit}
                  className="space-y-10"
                  noValidate
                  aria-busy={submitting}
                >
                  {/* Honeypot anti-bot — invisible aux humains */}
                  <input
                    type="text"
                    name={HONEYPOT_FIELD}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={honeypotStyle}
                    defaultValue=""
                  />
                  <p className="text-xs text-muted-foreground">
                    Les champs marqués d'un <span className="text-destructive">*</span> sont
                    obligatoires.
                  </p>

                  {showErrorBanner && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Merci de compléter les champs obligatoires avant l'envoi.</span>
                    </div>
                  )}

                  {submitError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{submitError}</span>
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
                            className="h-11 w-full min-w-0 flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
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
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Inspirations :</span>
                        {SUBJECT_EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setValue("subject", ex)}
                            className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <OffersField
                      offers={SERVICE_OFFERS}
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

                  <div className="-mx-5 space-y-5 rounded-b-3xl border-t border-border bg-surface/60 px-5 py-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
                    <label
                      className={cn(
                        "flex items-start gap-3 rounded-xl border bg-background/60 p-3.5 text-sm transition-colors",
                        consentError ? "border-destructive/40 bg-destructive/5" : "border-border",
                      )}
                    >
                      <Checkbox
                        id="contact-consent"
                        checked={consent}
                        onCheckedChange={(v) => {
                          const next = v === true;
                          setConsent(next);
                          if (next) setConsentError(false);
                        }}
                        className="mt-0.5"
                      />
                      <span className="leading-relaxed text-foreground/90">
                        <span aria-hidden className="mr-0.5 text-destructive">
                          *
                        </span>
                        J'accepte d'être recontacté(e) par {siteConfig.name} au sujet de ma demande
                        et le traitement de mes données comme décrit dans la{" "}
                        <a
                          href="/confidentialite"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand underline-offset-2 hover:underline"
                        >
                          politique de confidentialité
                        </a>
                        .
                      </span>
                    </label>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground sm:max-w-[60%]">
                        Réponse sous 48h ouvrées · Premier échange gratuit, sans engagement.
                      </p>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="group h-12 w-full bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90 sm:w-auto"
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
                  </div>
                </form>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="sm:col-span-2 lg:col-span-1">
                <InfoCard
                  highlight
                  icon={<Phone className="h-4 w-4 sm:h-5 sm:w-5" />}
                  title="Téléphone prioritaire"
                  text="Nous rappelons par téléphone en priorité. Indiquez un numéro joignable dans le formulaire."
                />
              </div>
              <InfoCard
                icon={<Mail className="h-4 w-4 sm:h-5 sm:w-5" />}
                title="Email direct"
                text={
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="break-all text-foreground hover:text-brand"
                  >
                    {siteConfig.email}
                  </a>
                }
              />
              <InfoCard
                icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
                title="Délais de réponse"
                text="Sous 48h ouvrées. Soutenance imminente ? Signalez-le, nous traitons en priorité."
              />
              <InfoCard
                icon={<User className="h-4 w-4 sm:h-5 sm:w-5" />}
                title="Basé à Sousse, Tunisie"
                text="Équipe biostatisticien + médecin pour thèses et publications."
              />
            </div>
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
