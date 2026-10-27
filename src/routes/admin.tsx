import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { FileBarChart2, LayoutDashboard, LogOut, Sigma, Users } from "lucide-react";
import { AdminGate } from "@/components/admin/AdminAuth";
import { useAdminSession } from "@/components/admin/session";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Insight Medics" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  return (
    <AdminGate>
      <AdminLayout />
    </AdminGate>
  );
}

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/audits", label: "Audits", icon: FileBarChart2, exact: false },
  { to: "/admin/analyses", label: "Analyses (500 DT)", icon: Sigma, exact: false },
  { to: "/admin/leads", label: "Prospects & clients", icon: Users, exact: false },
] as const;

// Toutes les données passent par l'API, qui exige l'en-tête X-Admin-Key
// (backend/app/auth.py) ; AdminGate ne montre l'admin qu'une fois la clé validée.
function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout } = useAdminSession();

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <Logo className="text-[22px] sm:text-[22px]" />
            <span className="hidden font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:inline">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="hidden px-3 text-xs text-muted-foreground hover:text-foreground sm:inline"
            >
              Voir le site
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
              <LogOut className="h-4 w-4" aria-hidden />
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[200px_1fr]">
        <nav
          aria-label="Navigation admin"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0"
        >
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                isActive(n.to, n.exact)
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <n.icon className="h-4 w-4" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
