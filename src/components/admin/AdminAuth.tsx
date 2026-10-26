import { useCallback, useEffect, useState } from "react";
import { AdminSessionContext } from "@/components/admin/session";
import type { FormEvent, ReactNode } from "react";
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_UNAUTHORIZED_EVENT,
  ApiError,
  UnauthorizedError,
  clearAdminKey,
  getAdminKey,
  listLeads,
  setAdminKey,
} from "@/lib/api/client";

/**
 * Accès à l'espace admin : un écran de connexion tant que la clé n'est pas validée par
 * l'API, puis l'admin. Toute réponse 401 ultérieure (clé changée côté serveur) ramène
 * ici avec un message, au lieu de pages vides.
 */

type State = { kind: "checking" } | { kind: "locked"; message?: string } | { kind: "ready" };

/** La clé est vérifiée par un appel admin léger : 401 = clé refusée. */
async function verify(): Promise<"ok" | "refused" | string> {
  try {
    await listLeads();
    return "ok";
  } catch (e) {
    if (e instanceof UnauthorizedError) return "refused";
    return e instanceof ApiError ? e.message : "Erreur inattendue. Réessayez.";
  }
}

export function AdminGate({ children }: { children: ReactNode }) {
  // Rendu serveur : la clé vit dans le navigateur, on ne la lit qu'après hydratation.
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    if (!getAdminKey()) {
      setState({ kind: "locked" });
      return;
    }
    verify().then((r) => {
      if (r === "ok") setState({ kind: "ready" });
      else if (r === "refused") {
        clearAdminKey();
        setState({ kind: "locked", message: "Votre clé n'est plus valide. Reconnectez-vous." });
      } else setState({ kind: "locked", message: r });
    });
  }, []);

  useEffect(() => {
    const onRefused = () => {
      clearAdminKey();
      setState({ kind: "locked", message: "Session expirée : la clé a été refusée." });
    };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onRefused);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onRefused);
  }, []);

  const logout = useCallback(() => {
    clearAdminKey();
    setState({ kind: "locked", message: "Déconnexion effectuée." });
  }, []);

  if (state.kind === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-brand" aria-label="Vérification…" />
      </div>
    );
  }
  if (state.kind === "locked") {
    return <LoginScreen message={state.message} onSuccess={() => setState({ kind: "ready" })} />;
  }
  return <AdminSessionContext.Provider value={{ logout }}>{children}</AdminSessionContext.Provider>;
}

function LoginScreen({ message, onSuccess }: { message?: string; onSuccess: () => void }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setError(null);
    setAdminKey(key);
    const r = await verify();
    setBusy(false);
    if (r === "ok") return onSuccess();
    clearAdminKey();
    setError(r === "refused" ? "Clé incorrecte. Vérifiez-la et réessayez." : r);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo className="text-[28px]" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Espace admin
          </p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-md border border-foreground bg-card p-6 shadow-offset"
          noValidate
        >
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-brand" aria-hidden />
            <h1 className="font-display text-3xl">Connexion</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Collez la clé admin pour accéder aux audits et au CRM. Elle reste enregistrée sur cet
            appareil jusqu'à la déconnexion.
          </p>

          {message && !error && (
            <p className="mt-4 rounded-md bg-surface px-3 py-2 text-sm" role="status">
              {message}
            </p>
          )}

          <Label htmlFor="admin-key" className="mt-5 block text-sm font-medium">
            Clé admin
          </Label>
          <div className="relative mt-1.5">
            <KeyRound
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="admin-key"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              autoFocus
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "admin-key-error" : undefined}
              className="h-11 pl-9 pr-11"
              placeholder="Coller la clé…"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={show ? "Masquer la clé" : "Afficher la clé"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p id="admin-key-error" className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-5 h-11 w-full" disabled={!key.trim() || busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  );
}
