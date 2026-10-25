import { Link } from "@tanstack/react-router";
import { Facebook, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/Logo";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-background/10 bg-ink text-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.2fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" aria-label="Insight Medics, accueil">
              <Logo inverted />
            </Link>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-background/75">
              {siteConfig.description}
            </p>
            <p className="mt-4 font-hand text-2xl text-brand-on-ink">
              Basé à {siteConfig.location}.
            </p>
          </div>

          <FooterColumn title="Navigation">
            {siteConfig.nav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-background">
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Contact">
            <li>
              <a
                href={`mailto:${siteConfig.email}`}
                className="gap-2 [overflow-wrap:anywhere] hover:text-background"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                <span>{siteConfig.email}</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-background"
              >
                <Facebook className="h-4 w-4" aria-hidden />
                Facebook
              </a>
            </li>
            <li>
              <Link to="/contact" className="hover:text-background">
                Formulaire de contact
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn title="Légal">
            {siteConfig.legal.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-background">
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-background/15 pt-6 text-sm text-background/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
          </p>
          <p>Pour les étudiants en médecine, internes, résidents et médecins.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-background/60">
        {title}
      </h2>
      <ul className="mt-3 space-y-1 text-[15px] text-background/85 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center">
        {children}
      </ul>
    </div>
  );
}
