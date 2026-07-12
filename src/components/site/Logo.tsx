import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// Placeholder monogramme tant que le client n'a pas uploadé son fichier.
// Quand le logo réel est dispo : passe `src="/logo.svg"` (ou import) en prop.
export function Logo({
  src,
  className,
  showWordmark = true,
}: {
  src?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {src ? (
        <img
          src={src}
          alt={siteConfig.name}
          className="h-9 w-auto"
          loading="eager"
          decoding="async"
        />
      ) : (
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
        >
          <span className="font-display text-sm font-extrabold tracking-tight">IM</span>
        </span>
      )}
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">{siteConfig.name}</span>
      )}
    </span>
  );
}
