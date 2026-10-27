import { breadcrumbLd, pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import {
  EXTRA_OFFERS,
  OFFERS,
  isOfferId,
  weeksLabel,
  type ExtraOfferId,
  type OfferId,
} from "@/lib/offers";
import { siteConfig } from "@/lib/site-config";
import { createLead } from "@/lib/api/client";
import { HONEYPOT_FIELD, honeypotStyle, isHoneypotTripped, isTooFast } from "@/lib/anti-spam";
import { cn } from "@/lib/utils";
import {
  SuccessState,
  FormSection,
  InfoCard,
  Field,
  CharCount,
  PillsField,
  OffersField,
  PhoneInputGroup,
  DEFAULT_DIAL_CODE,
  type ServiceOffer,
} from "@/components/contact/FormControls";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      path: "/contact",
      title: "Contact : parlons de votre thèse | Insight Medics",
      description:
        "Décrivez votre thèse ou votre article en quelques lignes : nous vous rappelons sous 48 h ouvrées pour cadrer le travail, le délai et le prix.",
      jsonLd: [breadcrumbLd([["Contact", "/contact"]])],
    }),
  // ?offre=these : formule pré-cochée quand on arrive depuis une fiche d'offre.
  validateSearch: (search: Record<string, unknown>): { offre?: OfferId | ExtraOfferId } =>
    isOfferId(search.offre) ? { offre: search.offre } : {},
  component: ContactPage,
});

const phoneLocalRegex = /^\d{6,12}$/;

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

// Lues dans lib/offers.ts (source unique des prix et délais).
const SERVICE_OFFERS: ServiceOffer[] = [
  ...OFFERS.map((o) => ({
    id: o.id,
    number: o.number,
    name: o.shortTitle,
    price: o.priceLabel,
    delay: `Livré en ${weeksLabel(o.delayWeeks)}`,
  })),
  ...EXTRA_OFFERS.map((o) => ({
    id: o.id,
    tag: "en plus",
    name: o.shortTitle,
    price: o.priceLabel,
    delay: o.price === null ? "Selon le nombre de fiches" : "Avant votre soutenance",
  })),
];

const URGENCIES = [
  "Moins de 2 semaines",
  "2 à 4 semaines",
  "Plus d'un mois",
  "Pas encore de date",
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
  const { offre } = Route.useSearch();
  const [values, setValues] = useState<Record<FieldName, string>>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState<string[]>(offre ? [offre] : []);
  const [urgency, setUrgency] = useState<string>("2-4 semaines");
  const [dialCode, setDialCode] = useState<string>(DEFAULT_DIAL_CODE);
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
        setTimeout(() => el?.focus(), 300);
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
            Parlons de <span className="italic text-brand">votre thèse.</span>
          </>
        }
        description="Décrivez votre étude en quelques lignes. Nous vous rappelons sous 48 h ouvrées pour cadrer ensemble le travail, le délai et le prix. Premier échange gratuit, sans engagement."
      />

      <Section className="pt-10 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10 xl:grid-cols-[1.6fr_1fr]">
          <div className="relative overflow-hidden rounded-md border border-foreground bg-card">
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
                      className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Merci de compléter les champs obligatoires avant l'envoi.</span>
                    </div>
                  )}

                  {submitError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <FormSection number={1} title="Vos coordonnées">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field id="name" error={errors.name} label="Nom complet" required>
                        <Input
                          id="name"
                          aria-invalid={!!errors.name || undefined}
                          aria-describedby={errors.name ? "name-error" : undefined}
                          name="name"
                          autoComplete="name"
                          required
                          maxLength={100}
                          value={values.name}
                          onChange={(e) => setValue("name", e.target.value)}
                          className="h-11"
                          placeholder="Prénom Nom"
                        />
                      </Field>
                      <Field
                        id="phone"
                        error={errors.phone}
                        label="Téléphone"
                        required
                        hint="Prioritaire pour vous recontacter"
                      >
                        <PhoneInputGroup
                          id="phone"
                          name="phone"
                          required
                          dialCode={dialCode}
                          onDialCodeChange={setDialCode}
                          digits={values.phone}
                          onDigitsChange={(digits) => setValue("phone", digits)}
                          invalid={!!errors.phone}
                        />
                      </Field>
                    </div>
                    <Field id="email" error={errors.email} label="Email" required>
                      <Input
                        id="email"
                        aria-invalid={!!errors.email || undefined}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                        placeholder="vous@exemple.tn"
                        value={values.email}
                        onChange={(e) => setValue("email", e.target.value)}
                        className="h-11"
                      />
                    </Field>
                  </FormSection>

                  <FormSection number={2} title="Votre étude">
                    <Field id="subject" error={errors.subject} label="Sujet" required>
                      <Input
                        id="subject"
                        aria-invalid={!!errors.subject || undefined}
                        aria-describedby={errors.subject ? "subject-error" : undefined}
                        name="subject"
                        required
                        maxLength={150}
                        placeholder="Ex. Thèse sur la prise en charge de l'infarctus aux urgences"
                        value={values.subject}
                        onChange={(e) => setValue("subject", e.target.value)}
                        className="h-11"
                      />
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Exemples :</span>
                        {SUBJECT_EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setValue("subject", ex)}
                            className="min-h-9 rounded-sm border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                  <FormSection number={3} title="Ce dont vous avez besoin">
                    <Field
                      id="problem"
                      error={errors.problem}
                      label="Problématique"
                      required
                      hint="Ce que vous cherchez à comprendre"
                    >
                      <Textarea
                        id="problem"
                        aria-invalid={!!errors.problem || undefined}
                        aria-describedby={errors.problem ? "problem-error" : undefined}
                        name="problem"
                        rows={4}
                        required
                        maxLength={1000}
                        placeholder="Ex. Facteurs pronostiques de l'infarctus chez le diabétique"
                        value={values.problem}
                        onChange={(e) => setValue("problem", e.target.value)}
                        className="resize-y"
                      />
                      <CharCount value={values.problem} max={1000} />
                    </Field>
                    <Field
                      id="objective"
                      error={errors.objective}
                      label="Ce que vous attendez de nous"
                      required
                      hint="Le livrable attendu : thèse complète, partie statistique, article…"
                    >
                      <Textarea
                        id="objective"
                        aria-invalid={!!errors.objective || undefined}
                        aria-describedby={errors.objective ? "objective-error" : undefined}
                        name="objective"
                        rows={4}
                        required
                        maxLength={1000}
                        placeholder="Ex. Comparer la mortalité à 30 jours selon le score SAPS II"
                        value={values.objective}
                        onChange={(e) => setValue("objective", e.target.value)}
                        className="resize-y"
                      />
                      <CharCount value={values.objective} max={1000} />
                    </Field>
                    <Field
                      id="message"
                      error={errors.message}
                      label="Autre chose à nous dire ?"
                      hint="Facultatif"
                    >
                      <Textarea
                        id="message"
                        aria-invalid={!!errors.message || undefined}
                        aria-describedby={errors.message ? "message-error" : undefined}
                        name="message"
                        rows={4}
                        maxLength={2000}
                        placeholder="Date de soutenance, état de votre base, consignes de votre directeur…"
                        value={values.message}
                        onChange={(e) => setValue("message", e.target.value)}
                        className="resize-y"
                      />
                      <CharCount value={values.message} max={2000} />
                    </Field>
                  </FormSection>

                  <div className="space-y-5 border-t border-foreground pt-6">
                    <label
                      className={cn(
                        "flex items-start gap-3 rounded-md border p-3.5 text-sm transition-colors",
                        consentError ? "border-destructive bg-destructive/5" : "border-border",
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
                        Rappel sous 48 h ouvrées · Premier échange gratuit, sans engagement.
                      </p>
                      <Button
                        type="submit"
                        disabled={submitting}
                        size="lg"
                        className="group w-full sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Envoi…
                          </>
                        ) : (
                          <>
                            Envoyer ma demande
                            <Send
                              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <InfoCard
                title="On vous rappelle"
                text="Le téléphone reste le plus rapide pour cadrer votre projet : indiquez un numéro où vous êtes joignable."
              />
              <InfoCard
                title="Votre soutenance approche ?"
                text="Indiquez sa date : nous vous dirons dès l'appel si le délai est tenable."
              />
              <InfoCard
                title="Vous préférez écrire ?"
                text={
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="text-foreground underline underline-offset-4 [overflow-wrap:anywhere] hover:text-brand"
                  >
                    {siteConfig.email}
                  </a>
                }
              />
              <InfoCard
                title={`Basés à ${siteConfig.location}`}
                text="Un médecin et un biostatisticien, pour les thèses, mémoires et articles en médecine."
              />
            </div>
          </aside>
        </div>
      </Section>

      <FinalCTA
        title="Vous préférez d'abord tester votre base ?"
        description="En quelques minutes, vous saurez si votre base est exploitable et ce qu'il reste à corriger. Gratuit, sans inscription."
        primary={{ to: "/audit", label: "Tester ma base gratuitement" }}
        secondary={{ to: "/methode", label: "Voir notre méthode" }}
      />
    </SiteLayout>
  );
}
