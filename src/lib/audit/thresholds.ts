// Seuils qui déclenchent l'alerte "expert humain dans 48h"
export const AUDIT_THRESHOLDS = {
  minScore: 70,
  maxMissingPct: 25,
  maxDuplicatesPct: 5,
} as const;

export function needsHumanReview(input: {
  score: number;
  missingPct: number;
  duplicatesPct: number;
  criticalIssues: number;
}): boolean {
  return (
    input.score < AUDIT_THRESHOLDS.minScore ||
    input.missingPct > AUDIT_THRESHOLDS.maxMissingPct ||
    input.duplicatesPct > AUDIT_THRESHOLDS.maxDuplicatesPct ||
    input.criticalIssues > 0
  );
}
