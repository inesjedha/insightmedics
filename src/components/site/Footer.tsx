import { Link } from "@tanstack/react-router";
import { Stethoscope, Mail } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/content";

export function SiteFooter() {
  const { lang } = useLang();
  const t = useContent(lang).site;
  return (
    <footer className="border-t border-border/60 bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">{t.name}</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">{t.description}</p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold">{t.footerNavTitle}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {t.nav.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold">{t.footerContactTitle}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${t.email}`}
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {t.email}
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  {t.footerContactForm}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {t.name}. {t.footerRights}
          </p>
          <p>{t.footerTagline}</p>
        </div>
      </div>
    </footer>
  );
}
