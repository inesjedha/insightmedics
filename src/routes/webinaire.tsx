import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import { ArrowDown, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import {
  CharCount,
  ConsentField,
  DEFAULT_DIAL_CODE,
  Field,
  FormAlert,
  FormSection,
  HoneypotField,
  PhoneInputGroup,
  PillsField,
  PrivacyLink,
  RequiredFieldsNote,
  SuccessState,
} from "@/components/contact/FormControls";
import { createLead } from "@/lib/api/client";
import { useSpamGuard } from "@/lib/anti-spam";
import { OTHER_CHOICE, SUBMIT_ERROR, fieldErrors, revealField, withOther } from "@/lib/forms";
import { breadcrumbLd, pageHead, webinarLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { WEBINAR } from "@/lib/webinar";

const DESCRIPTION = `${WEBINAR.dateLabel} à ${WEBINAR.timeLabel} (heure de Tunis), en ligne et gratuit : votre base, vos tests, vos résultats. Avec le Dr Hamza Ben Kheder.`;

export const Route = createFileRoute("/webinaire")({
  head: () =>
    pageHead({
      path: WEBINAR.path,
      title: "Webinaire gratuit : les stats de ta thèse | Insight Medics",
      ogTitle: `Webinaire gratuit : ${WEBINAR.title}`,
      description: DESCRIPTION,
      jsonLd: [webinarLd(DESCRIPTION), breadcrumbLd([["Webinaire", WEBINAR.path]])],
    }),
  // ?utm_source=facebook : canal pré-rempli pour les liens des campagnes du lancement.
  validateSearch: (search: Record<string, unknown>): { utm_source?: string } =>
    typeof search.utm_source === "string" && search.utm_source.trim()
      ? { utm_source: search.utm_source.trim().slice(0, 40) }
      : {},
  component: WebinarPage,
});

const PROGRAMME = [
  "Une base prête à analyser",
  "Choisir ses tests",
  "Lire et écrire un résultat : p, IC 95 %, odds ratio",
  "Présenter ses résultats aux normes de sa faculté",
  "Le test gratuit de votre base, en direct",
  "Vos questions",
] as const;

const FACULTIES = ["Sousse", "Tunis", "Monastir", "Sfax", OTHER_CHOICE] as const;
const STATUSES = ["Interne", "Résident", OTHER_CHOICE] as const;
const REFERRALS = [
  "Facebook",
  "Groupe de promo",
  "WhatsApp",
  "Association étudiante",
  "Affiche",
  "Un ami",
  OTHER_CHOICE,
] as const;

/** Valeurs de `utm_source` des liens de campagne → canal proposé dans le formulaire. */
const UTM_REFERRALS: Record<string, (typeof REFERRALS)[number]> = {
  facebook: "Facebook",
  fb: "Facebook",
  promo: "Groupe de promo",
  groupe: "Groupe de promo",
  whatsapp: "WhatsApp",
  wa: "WhatsApp",
  association: "Association étudiante",
  asso: "Association étudiante",
  affiche: "Affiche",
  qr: "Affiche",
  ami: "Un ami",
};

/** Canal pré-rempli : celui du lien, sinon « Autre » précisé par la source brute. */
function referralFromUtm(utmSource?: string): { choice: string; other: string } {
  if (!utmSource) return { choice: "", other: "" };
  const known = UTM_REFERRALS[utmSource.toLowerCase()];
  return known ? { choice: known, other: "" } : { choice: OTHER_CHOICE, other: utmSource };
}

const NEXT_STEPS = [
  `Rendez-vous le ${WEBINAR.dateLabel.toLowerCase()} à ${WEBINAR.timeLabel} (heure de Tunis), en ligne.`,
  "Le lien de connexion vous arrive par e-mail la veille et une heure avant le début.",
  "Préparez vos questions, et votre base si vous voulez que nous parlions de votre cas.",
  "Le replay et les diapositives vous sont envoyés le lendemain.",
] as const;

const FORM_ID = "inscription";

const webinarSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "Numéro à 6-12 chiffres requis"),
  faculty: z.string().min(1, "Choisissez votre faculté"),
  status: z.string().min(1, "Choisissez votre année ou votre statut"),
  question: z.string().trim().max(1000, "Trop long (max. 1000 caractères)"),
});

type FieldName = keyof z.infer<typeof webinarSchema>;
type FieldErrors = Partial<Record<FieldName, string>>;

const INITIAL_VALUES: Record<FieldName, string> = {
  name: "",
  email: "",
  phone: "",
  faculty: "",
  status: "",
  question: "",
};

function WebinarPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Webinaire gratuit · en ligne"
        title={
          <>
            {WEBINAR.title}
            <span className="text-brand">.</span>
          </>
        }
        description="Une séance en direct pour avancer sur la partie statistique de votre thèse, de la base de données à la présentation de vos résultats. Animée par le Dr Hamza Ben Kheder."
      />

      <Section className="pt-10 sm:pt-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="space-y-12">
            <EventFacts />
            <Programme />
            <Host />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <RegistrationForm />
          </div>
        </div>
      </Section>

      <FinalCTA
        title="En attendant, testez votre base."
        description="En quelques minutes, un score sur 100 et la liste des anomalies à corriger. Gratuit, sans inscription. Vous pourrez en parler pendant le webinaire."
        primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
        secondary={{ to: "/guides", label: "Lire les guides gratuits" }}
      />
    </SiteLayout>
  );
}

/** Date, heure et format : ce qu'il faut retenir avant même de lire le programme. */
function EventFacts() {
  return (
    <div className="border-t border-foreground pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Rendez-vous
      </p>
      <p className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
        <time dateTime={WEBINAR.startDate}>
          {WEBINAR.dateLabel}, <span className="italic text-brand">{WEBINAR.timeLabel}</span>
        </time>
      </p>
      <p className="mt-1 text-[15px] text-muted-foreground">Heure de Tunis</p>
      <p className="mt-4 origin-left -rotate-1 font-hand text-2xl leading-snug text-brand sm:text-[26px]">
        gratuit · en ligne · 45 minutes + questions
      </p>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Sur Google Meet : le lien de connexion vous est envoyé par e-mail avant le webinaire.
      </p>
      <Button asChild size="lg" className="mt-6 w-full sm:w-auto lg:hidden">
        <a href={`#${FORM_ID}`}>
          Je m'inscris
          <ArrowDown className="h-4 w-4" aria-hidden />
        </a>
      </Button>
    </div>
  );
}

function Programme() {
  return (
    <div>
      <h2 className="font-display text-4xl">Au programme</h2>
      <ol className="mt-5 border-t border-foreground">
        {PROGRAMME.map((item, i) => (
          <li key={item} className="flex items-baseline gap-4 border-b border-border py-3.5">
            <span aria-hidden className="w-6 shrink-0 font-hand text-2xl leading-none text-brand">
              {i + 1}.
            </span>
            <span className="text-[15px] leading-relaxed sm:text-base">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Host() {
  return (
    <div className="rounded-md border border-foreground bg-card p-6 shadow-offset">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Animé par
      </p>
      <p className="mt-2 font-display text-3xl">Dr Hamza Ben Kheder</p>
      <p className="mt-1 text-sm font-medium text-brand">Médecin · cofondateur d'Insight Medics</p>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Avec l'équipe, il a accompagné plus de 30 thèses de médecine dans les facultés de Sousse,
        Tunis, Monastir et Sfax, de la base de données jusqu'à la soutenance.
      </p>
      <Link
        to="/a-propos"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:text-brand"
      >
        Découvrir l'équipe
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function RegistrationForm() {
  const { utm_source } = Route.useSearch();
  const [values, setValues] = useState<Record<FieldName, string>>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [facultyOther, setFacultyOther] = useState("");
  const [statusOther, setStatusOther] = useState("");
  const [referral, setReferral] = useState(() => referralFromUtm(utm_source));
  const [dialCode, setDialCode] = useState<string>(DEFAULT_DIAL_CODE);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isSpam = useSpamGuard();

  const setValue = (name: FieldName, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /** La confirmation remplace un long formulaire : on la ramène à l'écran (mobile). */
  const showConfirmation = () => {
    setSubmitted(true);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;

    // Anti-spam silencieux : honeypot rempli ou form soumis trop vite => faux succès.
    if (isSpam(form)) {
      showConfirmation();
      return;
    }

    const parsed = webinarSchema.safeParse(values);
    if (!parsed.success || !consent) {
      const fe: FieldErrors = parsed.success ? {} : fieldErrors<FieldName>(parsed.error);
      setErrors(fe);
      setConsentError(!consent);
      // Champs dans l'ordre du formulaire : on amène le premier en erreur à l'écran.
      const first = (Object.keys(INITIAL_VALUES) as FieldName[]).find((k) => fe[k]);
      revealField(form.querySelector<HTMLElement>(`#webinar-${first ?? "consent"}`));
      return;
    }

    setErrors({});
    setConsentError(false);
    setSubmitError(null);
    setSubmitting(true);
    const { data } = parsed;
    // Lisible tel quel par l'équipe, dans l'admin comme dans le mail de notification.
    const message = [
      `Faculté : ${withOther(data.faculty, facultyOther)}`,
      `Statut : ${withOther(data.status, statusOther)}`,
      data.question && `Question : ${data.question}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await createLead({
        source: "webinaire",
        name: data.name,
        email: data.email,
        phone: `${dialCode} ${data.phone}`,
        subject: WEBINAR.leadSubject,
        message,
        referral: withOther(referral.choice, referral.other),
      });
      setValues(INITIAL_VALUES);
      setFacultyOther("");
      setStatusOther("");
      setConsent(false);
      showConfirmation();
    } catch (err) {
      console.error("[webinaire] submit failed", err);
      setSubmitError(SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean) || consentError;

  return (
    <div
      ref={cardRef}
      id={FORM_ID}
      className="scroll-mt-24 rounded-md border border-foreground bg-card p-5 sm:p-8"
    >
      {submitted ? (
        <SuccessState
          title="Inscription confirmée, vous recevez un e-mail."
          steps={NEXT_STEPS}
          resetLabel="Inscrire une autre personne"
          onReset={() => setSubmitted(false)}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-8" noValidate aria-busy={submitting}>
          <div>
            <h2 className="font-display text-4xl">Je m'inscris</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Gratuit. Vous recevez une confirmation par e-mail, puis le lien de connexion.
            </p>
          </div>
          <HoneypotField />
          <RequiredFieldsNote />

          {hasErrors && (
            <FormAlert>Merci de compléter les champs obligatoires avant l'envoi.</FormAlert>
          )}
          {submitError && <FormAlert>{submitError}</FormAlert>}

          <FormSection number={1} title="Vous">
            <Field id="webinar-name" error={errors.name} label="Prénom et nom" required>
              <Input
                id="webinar-name"
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                placeholder="Prénom Nom"
                value={values.name}
                onChange={(e) => setValue("name", e.target.value)}
                aria-invalid={!!errors.name || undefined}
                aria-describedby={errors.name ? "webinar-name-error" : undefined}
                className="h-11"
              />
            </Field>
            <Field id="webinar-email" error={errors.email} label="Email" required>
              <Input
                id="webinar-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                placeholder="vous@exemple.tn"
                value={values.email}
                onChange={(e) => setValue("email", e.target.value)}
                aria-invalid={!!errors.email || undefined}
                aria-describedby={errors.email ? "webinar-email-error" : undefined}
                className="h-11"
              />
            </Field>
            <Field id="webinar-phone" error={errors.phone} label="WhatsApp" required>
              <PhoneInputGroup
                id="webinar-phone"
                name="phone"
                required
                dialCode={dialCode}
                onDialCodeChange={setDialCode}
                digits={values.phone}
                onDigitsChange={(digits) => setValue("phone", digits)}
                invalid={!!errors.phone}
              />
            </Field>
            <PillsField
              id="webinar-faculty"
              label="Faculté"
              required
              options={FACULTIES}
              value={values.faculty}
              onChange={(v) => setValue("faculty", v)}
              error={errors.faculty}
              other={facultyOther}
              onOtherChange={setFacultyOther}
              otherLabel="Précisez votre faculté"
            />
            <PillsField
              id="webinar-status"
              label="Année ou statut"
              required
              options={STATUSES}
              value={values.status}
              onChange={(v) => setValue("status", v)}
              error={errors.status}
              other={statusOther}
              onOtherChange={setStatusOther}
              otherLabel="Précisez votre année ou votre statut"
            />
          </FormSection>

          <FormSection number={2} title="Le webinaire">
            <Field
              id="webinar-question"
              error={errors.question}
              label="Une question à poser ?"
              hint="Facultatif : nous y répondrons pendant la séance"
            >
              <Textarea
                id="webinar-question"
                name="question"
                rows={3}
                maxLength={1000}
                placeholder="Ex. Quel test pour comparer deux groupes de patients ?"
                value={values.question}
                onChange={(e) => setValue("question", e.target.value)}
                aria-invalid={!!errors.question || undefined}
                aria-describedby={errors.question ? "webinar-question-error" : undefined}
                className="resize-y"
              />
              <CharCount value={values.question} max={1000} />
            </Field>
            <PillsField
              label="Comment avez-vous connu le webinaire ? (facultatif)"
              options={REFERRALS}
              value={referral.choice}
              onChange={(v) => setReferral((r) => ({ ...r, choice: v === r.choice ? "" : v }))}
              other={referral.other}
              onOtherChange={(other) => setReferral((r) => ({ ...r, other }))}
              otherLabel="Précisez comment vous avez connu le webinaire"
            />
          </FormSection>

          <div className="space-y-5 border-t border-foreground pt-6">
            <ConsentField
              id="webinar-consent"
              checked={consent}
              onCheckedChange={(next) => {
                setConsent(next);
                if (next) setConsentError(false);
              }}
              error={consentError}
            >
              J'accepte de recevoir par e-mail et WhatsApp les informations du webinaire (lien de
              connexion, rappels, replay) et le traitement de mes données comme décrit dans la{" "}
              <PrivacyLink>politique de confidentialité</PrivacyLink>.
            </ConsentField>
            <Button type="submit" disabled={submitting} size="lg" className="group w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Envoi…
                </>
              ) : (
                <>
                  Je m'inscris gratuitement
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
