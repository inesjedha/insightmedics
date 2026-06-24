import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/content";

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

type ContactValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
type FieldErrors = Partial<Record<keyof ContactValues, string>>;

function ContactPage() {
  const { lang } = useLang();
  const t = useContent(lang).contact;
  const email = useContent(lang).site.email;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t.errors.nameMin).max(100, t.errors.nameMax),
        email: z.string().trim().email(t.errors.emailInvalid).max(255, t.errors.emailMax),
        subject: z.string().trim().min(3, t.errors.subjectMin).max(150, t.errors.subjectMax),
        message: z
          .string()
          .trim()
          .min(20, t.errors.messageMin)
          .max(2000, t.errors.messageMax),
      }),
    [t.errors],
  );

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const parsed = schema.safeParse(data);
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
        <SectionHeader eyebrow={t.eyebrow} title={t.title} description={t.desc} />
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
                  <h3 className="font-display text-xl font-bold">{t.successTitle}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t.successDesc}</p>
                </div>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  {t.successAgain}
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="name" label={t.fields.name} error={errors.name}>
                    <Input id="name" name="name" autoComplete="name" required maxLength={100} />
                  </Field>
                  <Field id="email" label={t.fields.email} error={errors.email}>
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

                <Field id="subject" label={t.fields.subject} error={errors.subject}>
                  <Input
                    id="subject"
                    name="subject"
                    required
                    maxLength={150}
                    placeholder={t.fields.subjectPh}
                  />
                </Field>

                <Field id="message" label={t.fields.message} error={errors.message}>
                  <Textarea
                    id="message"
                    name="message"
                    rows={7}
                    required
                    maxLength={2000}
                    placeholder={t.fields.messagePh}
                  />
                </Field>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">{t.consent}</p>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    {submitting ? (
                      t.submitting
                    ) : (
                      <>
                        {t.submit} <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">{t.asideEmailTitle}</h3>
              <a
                href={`mailto:${email}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:text-brand"
              >
                <Mail className="h-4 w-4" />
                {email}
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">{t.asideDelayTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.asideDelayText}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="font-display text-base font-semibold">{t.asideConfTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.asideConfText}</p>
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
