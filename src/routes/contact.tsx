import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Insight Medics" },
      {
        name: "description",
        content:
          "Discutez de votre projet de thèse, de votre base de données ou de notre prestation d'analyse statistique. Réponse sous 48h.",
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

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nom trop court")
    .max(100, "Nom trop long"),
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .max(255, "Email trop long"),
  subject: z
    .string()
    .trim()
    .min(3, "Sujet trop court")
    .max(150, "Sujet trop long"),
  message: z
    .string()
    .trim()
    .min(20, "Détaillez un peu plus (min. 20 caractères)")
    .max(2000, "Message trop long (max. 2000 caractères)"),
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
    // TODO: brancher sur ton endpoint backend POST /api/contact
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
    form.reset();
  };

  return (
    <SiteLayout>
      <Section className="pb-6">
        <SectionHeader
          eyebrow="Contact"
          title="Parlons de votre projet."
          description="Décrivez en quelques lignes votre étude, l'état de votre base et vos délais. Nous revenons vers vous sous 48h."
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
                    Merci. Nous vous répondons sous 48h ouvrées à l'adresse
                    indiquée.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label="Nom complet"
                    error={errors.name}
                  >
                    <Input id="name" name="name" autoComplete="name" required maxLength={100} />
                  </Field>
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

                <Field id="subject" label="Sujet" error={errors.subject}>
                  <Input
                    id="subject"
                    name="subject"
                    required
                    maxLength={150}
                    placeholder="Ex. Analyse statistique pour thèse en cardiologie"
                  />
                </Field>

                <Field id="message" label="Votre message" error={errors.message}>
                  <Textarea
                    id="message"
                    name="message"
                    rows={7}
                    required
                    maxLength={2000}
                    placeholder="Type d'étude, taille de la base, deadline, attentes…"
                  />
                </Field>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    En envoyant ce message, vous acceptez d'être recontacté(e)
                    par email.
                  </p>
                  <Button type="submit" disabled={submitting} className="bg-brand text-brand-foreground hover:bg-brand/90">
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
              <h3 className="font-display text-base font-semibold">
                Email direct
              </h3>
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:text-brand"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.email}
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">
                Délais de réponse
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Réponse sous 48h ouvrées. Pour les soutenances imminentes,
                signalez-le dès le premier message — nous traitons en priorité.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">
                Confidentialité
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ne joignez pas votre base ici. Si nous lançons une prestation,
                vous nous l'enverrez via notre canal sécurisé d'upload.
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
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
