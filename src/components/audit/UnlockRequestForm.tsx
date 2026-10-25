import { useRef, useState } from "react";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, IconInput, PhoneField } from "@/components/contact/FormControls";
import { createLead } from "@/lib/api/client";
import type { AuditResult } from "@/lib/api/types";
import { HONEYPOT_FIELD, honeypotStyle, isHoneypotTripped, isTooFast } from "@/lib/anti-spam";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";

/** Ancre de la section, ciblée par les boutons « Débloquer » de l'aperçu. */
export const UNLOCK_ANCHOR_ID = "debloquer";

const phoneRegex = /^(\+|00)?\d[\d\s().-]{6,18}$/;
const unlockSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, "Numéro trop court")
    .max(25, "Numéro trop long")
    .regex(phoneRegex, "Numéro invalide"),
  email: z.string().trim().email("Email invalide").max(255),
  name: z.string().trim().max(100).optional().or(z.literal("")),
});

export function UnlockRequestForm({ result }: { result: AuditResult }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mountedAtRef = useRef<number>(Date.now());

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    // Anti-spam silencieux : honeypot + soumission trop rapide => faux succès.
    if (isHoneypotTripped(data[HONEYPOT_FIELD]) || isTooFast(mountedAtRef.current)) {
      setSent(true);
      return;
    }

    if (!consent) {
      setErrors({ consent: "Acceptation requise pour continuer" });
      return;
    }

    const parsed = unlockSchema.safeParse(data);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = String(i.path[0]);
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSending(true);
    try {
      // Score et priorité sont déduits de l'audit par le serveur.
      await createLead({
        source: "audit",
        name: parsed.data.name || undefined,
        email: parsed.data.email,
        phone: parsed.data.phone,
        auditId: result.id,
      });
      setSent(true);
    } catch {
      setSubmitError(
        "L'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez-nous directement par email.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      id={UNLOCK_ANCHOR_ID}
      className="mt-6 scroll-mt-24 rounded-md border border-foreground bg-card p-6 sm:p-8"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Audit complet · {FULL_AUDIT_PRICE_LABEL}
        </p>
        <h3 className="mt-2 font-display text-3xl">Recevez le plan de correction complet.</h3>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Laissez vos coordonnées : nous vous rappelons sous 48 h ouvrées pour régler le paiement,
          puis nous lançons votre audit complet. Vous recevez ensuite un lien privé vers vos
          résultats et vos livrables.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {[
          "Relu par un médecin et un biostatisticien",
          "Données anonymisées",
          "Vous ne payez qu'après nous avoir parlé",
        ].map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-brand" aria-hidden />
            {t}
          </span>
        ))}
      </div>

      {sent ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-md border border-brand/30 bg-accent p-4 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div>
            <p className="font-semibold">C'est noté, merci !</p>
            <p className="mt-1 text-muted-foreground">
              Nous vous rappelons sous 48 h ouvrées pour régler les {FULL_AUDIT_PRICE_LABEL}. Dès le
              paiement reçu, votre audit complet est lancé et vous recevez le lien privé vers vos
              résultats et vos livrables.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
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

          <Field id="name" label="Nom complet">
            <IconInput icon={<User className="h-4 w-4" />}>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                maxLength={100}
                placeholder="Ibn Sina"
                className="h-11 pl-10"
              />
            </IconInput>
          </Field>

          <PhoneField required hint="Prioritaire pour vous recontacter" />

          {errors.phone && <p className="text-xs text-destructive sm:col-span-2">{errors.phone}</p>}

          <div className="sm:col-span-2">
            <Field id="email" label="Email" required>
              <IconInput icon={<Mail className="h-4 w-4" />}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={255}
                  placeholder="prenom@exemple.com"
                  className="h-11 pl-10"
                />
              </IconInput>
            </Field>
            {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-md border border-border bg-surface/40 p-3.5 text-sm">
              <Checkbox
                id="audit-consent"
                checked={consent}
                onCheckedChange={(v) => {
                  setConsent(v === true);
                  if (v === true && errors.consent) {
                    setErrors((prev) => ({ ...prev, consent: undefined }));
                  }
                }}
                className="mt-0.5"
              />
              <span className="leading-relaxed text-foreground/90">
                J'accepte que mon fichier et mes coordonnées soient traités pour générer cet audit
                et d'être recontacté(e) par Insight Medics.{" "}
                <a
                  href="/confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline-offset-2 hover:underline"
                >
                  Politique de confidentialité
                </a>
                .
              </span>
            </label>
            {errors.consent && <p className="mt-1.5 text-xs text-destructive">{errors.consent}</p>}
          </div>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive sm:col-span-2"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{submitError}</span>
            </div>
          )}

          <div className="sm:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button type="submit" disabled={sending}>
              {sending ? "Envoi…" : `Demander l'audit complet (${FULL_AUDIT_PRICE_LABEL})`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
