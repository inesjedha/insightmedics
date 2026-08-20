import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, Users, FileBarChart2, KeyRound, Check } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminKey, setAdminKey } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Insight Medics" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

// TODO security: protéger cette zone avant publication (auth backend).
function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/audits", label: "Audits", icon: FileBarChart2, exact: false },
    { to: "/admin/leads", label: "Prospects & clients", icon: Users, exact: false },
  ] as const;

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <Logo showWordmark={false} />
            <span className="font-display text-sm font-semibold text-foreground">Admin · CRM</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Retour au site
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                isActive(n.to, n.exact)
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
          <AdminKeyBox />
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminKeyBox() {
  const [value, setValue] = useState(getAdminKey());
  const hasKey = getAdminKey().length > 0;

  const save = () => {
    setAdminKey(value);
    // On recharge pour que toutes les pages refassent leurs requêtes avec la nouvelle clé.
    window.location.reload();
  };

  return (
    <div className="mt-4 space-y-2 rounded-md border border-border bg-surface/50 p-3 text-xs">
      <p className="flex items-center gap-1.5 font-medium text-foreground/80">
        <KeyRound className="h-3.5 w-3.5" /> Clé admin
      </p>
      <Input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Coller la clé…"
        className="h-8 text-xs"
      />
      <Button size="sm" onClick={save} disabled={!value.trim()} className="w-full">
        Enregistrer
      </Button>
      <p className={cn("text-[11px]", hasKey ? "text-brand" : "text-muted-foreground")}>
        {hasKey ? (
          <>
            <Check className="mr-1 inline h-3 w-3" />
            Clé configurée
          </>
        ) : (
          "Requise pour le CRM et le déblocage des audits."
        )}
      </p>
    </div>
  );
}
