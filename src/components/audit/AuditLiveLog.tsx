import { Cpu, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditEvent } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type AuditPhase = "idle" | "running" | "done";

export function AuditLiveLog({ events, phase }: { events: AuditEvent[]; phase: AuditPhase }) {
  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-sans text-base font-semibold">
          <Cpu className="mr-2 inline h-4 w-4 text-brand" />
          Analyses en temps réel
        </h3>
        {phase === "running" && (
          <Badge variant="outline" className="border-brand/30 text-brand">
            En cours
          </Badge>
        )}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {events.length === 0 && phase === "idle" && (
          <li className="text-muted-foreground">
            Le journal d'analyse s'affichera ici une fois l'audit lancé.
          </li>
        )}
        {events.map((e, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3 rounded-md px-3 py-2",
              e.level === "critical" && "bg-destructive/10 text-destructive",
              e.level === "warn" && "bg-amber-500/10 text-amber-700 dark:text-amber-300",
              e.level === "success" && "bg-brand/10 text-brand",
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
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Analyse structurelle de votre base — quelques secondes…
          </li>
        )}
      </ul>
    </div>
  );
}
