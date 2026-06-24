import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs font-semibold",
        className,
      )}
      role="group"
      aria-label={lang === "fr" ? "Changer la langue" : "Bedel el lougha"}
    >
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          lang === "fr"
            ? "bg-brand text-brand-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={lang === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang("tn")}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          lang === "tn"
            ? "bg-brand text-brand-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={lang === "tn"}
      >
        TN
      </button>
    </div>
  );
}
