# Routes

Routage par fichiers (TanStack Router) : chaque fichier de ce dossier est une page.
`__root.tsx` est la coquille commune (balises `<head>`, pages 404 et erreur).
`src/routeTree.gen.ts` est régénéré automatiquement par `bun run dev` : ne pas l'éditer.

| Fichier                                                   | URL                                       | Rôle                                            |
| --------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| `index.tsx`                                               | `/`                                       | Accueil                                         |
| `services.tsx`, `methode.tsx`, `tarifs.tsx`               | `/services`, `/methode`, `/tarifs`        | Pages vitrine                                   |
| `contact.tsx`                                             | `/contact`                                | Formulaire de contact → lead                    |
| `audit.tsx`                                               | `/audit`                                  | Upload, aperçu gratuit, demande de déblocage    |
| `webinaire.tsx`                                           | `/webinaire`                              | Inscription au webinaire → lead                 |
| `r.$token.tsx`                                            | `/r/:token`                               | Espace client privé (audit complet + livrables) |
| `admin.tsx`                                               | `/admin/*`                                | Mise en page admin + saisie de la clé           |
| `admin.index.tsx`, `admin.leads*.tsx`, `admin.audits.tsx` | `/admin`, `/admin/leads`, `/admin/audits` | CRM et déblocage des audits                     |
| `mentions-legales.tsx`, `cgv.tsx`, `confidentialite.tsx`  | pages légales                             |                                                 |

Convention de nommage : `.` dans le nom = `/` dans l'URL, `$x` = paramètre dynamique.
