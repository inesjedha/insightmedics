import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Send, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";
import { createLead } from "@/lib/api/client";

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
        content: "Réponse sous 48h. Décrivez votre projet et nous revenons vers vous.",
      },
    ],
  }),
  component: ContactPage,
});

// Téléphone : accepte +216 / 00216 / 8 chiffres locaux, espaces tolérés.
const phoneRegex = /^(\+|00)?\d[\d\s().-]{6,18}$/;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z
    .string()
    .trim()
    .min(8, "Numéro de téléphone trop court")
    .max(25, "Numéro trop long")
    .regex(phoneRegex, "Numéro de téléphone invalide"),
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
type FieldErrors = Partial<Record<keyof ContactValues, string>>;

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof ContactValues;
        if (!fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await createLead({
        source: "contact",
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        subject: parsed.data.subject,
        problem: parsed.data.problem,
        objective: parsed.data.objective,
        message: parsed.data.message || undefined,
      });
      setSubmitted(true);
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <Section className="pb-6">
        <SectionHeader
          eyebrow="Contact"
          title="Parlons de votre projet."
          description="Décrivez votre étude, votre problématique et votre objectif. Nous revenons vers vous sous 48h."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-start gap-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Message envoyé.</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Merci. Nous vous répondons sous 48h ouvrées par téléphone
                    ou email.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6" noValidate>
                {/* Identité */}
                <div className="space-y-5">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Vos coordonnées
                  </h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="name" label="Nom complet" error={errors.name}>
                      <Input id="name" name="name" autoComplete="name" required maxLength={100} />
                    </Field>
                    <Field id="phone" label="Téléphone" error={errors.phone} hint="Prioritaire pour vous recontacter">
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        maxLength={25}
                        placeholder="+216 ..."
                      />
                    </Field>
                  </div>
                  <Field id="email" label="Email" error={errors.email}>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={255}
                    />
                  </Field>
                </div>

                {/* Section 1 : Sujet */}
                <div className="space-y-5 border-t border-border pt-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    1. Sujet
                  </h3>
                  <Field id="subject" label="Sujet de votre étude" error={errors.subject}>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      maxLength={150}
                      placeholder="Ex. Thèse sur la prise en charge de l'infarctus aux urgences"
                    />
                  </Field>
                </div>

                {/* Section 2 : Problématique + Objectif */}
                <div className="space-y-5 border-t border-border pt-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    2. Problématique & Objectif
                  </h3>
                  <Field id="problem" label="Problématique" error={errors.problem}>
                    <Textarea
                      id="problem"
                      name="problem"
                      rows={4}
                      required
                      maxLength={1000}
                      placeholder="Quel est le problème clinique ou scientifique abordé ?"
                    />
                  </Field>
                  <Field id="objective" label="Objectif" error={errors.objective}>
                    <Textarea
                      id="objective"
                      name="objective"
                      rows={4}
                      required
                      maxLength={1000}
                      placeholder="Quel résultat / livrable cherchez-vous ?"
                    />
                  </Field>
                </div>

                {/* Message libre */}
                <div className="space-y-5 border-t border-border pt-6">
                  <Field id="message" label="Message complémentaire (optionnel)" error={errors.message}>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      maxLength={2000}
                      placeholder="Deadline, état actuel de la base, points particuliers…"
                    />
                  </Field>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    En envoyant ce message, vous acceptez d'être recontacté(e) par téléphone ou email.
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    {submitting ? "Envoi…" : (
                      <>
                        Envoyer <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">Email direct</h3>
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:text-brand"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.email}
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">Délais de réponse</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Réponse sous 48h ouvrées. Pour les soutenances imminentes,
                signalez-le dès le premier message — nous traitons en priorité.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">
                <Phone className="mr-2 inline h-4 w-4 text-brand" />
                Téléphone prioritaire
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Nous rappelons par téléphone en priorité. Indiquez un numéro
                joignable.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {hint && <span className="text-xs text-brand">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
