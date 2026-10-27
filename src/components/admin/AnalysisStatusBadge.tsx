import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisStatus } from "@/lib/api/types";

const LABELS: Record<AnalysisStatus, string> = {
  awaiting_base: "En attente de la base corrigée",
  planning: "Plan en préparation",
  plan_ready: "Plan à valider",
  computing: "Calculs et rédaction en cours",
  review: "À relire avant livraison",
  delivered: "Livrée",
  failed: "Échec",
};

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  if (status === "planning" || status === "computing") {
    return (
      <Badge variant="outline" className="gap-1 border-brand/30 text-brand">
        <Loader2 className="h-3 w-3 animate-spin" /> {LABELS[status]}
      </Badge>
    );
  }
  const tone =
    status === "delivered"
      ? "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
      : status === "failed"
        ? "text-destructive"
        : status === "plan_ready" || status === "review"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : "text-muted-foreground";
  return (
    <Badge variant="outline" className={tone}>
      {LABELS[status]}
    </Badge>
  );
}
