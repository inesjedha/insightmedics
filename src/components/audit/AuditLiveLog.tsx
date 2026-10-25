import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditEvent } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type AuditPhase = "idle" | "running" | "done";

export function AuditLiveLog({ events, phase }: { events: AuditEvent[]; phase: AuditPhase }) {
  return (
    <div className="rounded-md border border-border bg-card p-6 lg:self-start">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Vérification en direct</h3>
        {phase === "running" && (
          <Badge variant="outline" className="border-brand/30 text-brand">
            En cours
          </Badge>
        )}
      </div>
      <ul className="mt-4 space-y-2 text-sm" role="log" aria-live="polite">
        {events.length === 0 && phase === "idle" && (
          <li className="text-muted-foreground">
            Le détail de chaque contrôle s'affichera ici dès que vous lancerez la vérification.
          </li>
        )}
        {events.map((e, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3 rounded-md px-3 py-2",
              e.level === "critical" && "bg-destructive/10 text-destructive",
              e.level === "warn" && "bg-highlight/60 text-foreground",
              e.level === "success" && "bg-accent text-accent-foreground",
              e.level === "info" && "text-foreground/80",
            )}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(e.ts).toLocaleTimeString()}
            </span>
            <span>{e.message}</span>
          </li>
        ))}
        {phase === "running" && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Vérification de la structure de votre base, quelques secondes…
          </li>
        )}
      </ul>
    </div>
  );
}
