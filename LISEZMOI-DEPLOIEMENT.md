# Marchés Malins — mise en ligne (≈ 30 min)

Même méthode que FichePilote. Rien à coder.

## 1. Domaine
Acheter le domaine (ex. `marchesmalins.fr`) chez OVH. Plus tard : un 2ᵉ domaine pour la prospection (ex. `marchesmalins-mail.fr`) + 1 boîte Google Workspace.

## 2. GitHub
Nouveau dépôt **privé** `marchesmalins` → « uploading an existing file » → glisser tout le contenu du zip (sauf `node_modules` s'il y est).

## 3. Vercel
Add New → Project → importer `marchesmalins`. Storage → Create → **Upstash Redis** (nouvelle base, région Paris/Francfort) → Connect.
Variables (Settings → Environment Variables) :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://marchesmalins.fr` |
| `APP_SECRET` | 40 caractères au hasard |
| `CRON_SECRET` | 30 caractères au hasard |
| `ADMIN_PASSWORD` | mot de passe admin |
| `ADMIN_EMAIL` | `mattfau83@gmail.com` |
| `GROQ_API_KEY` | la même que FichePilote |
| `RESEND_API_KEY` | la même (ajouter le domaine marchesmalins.fr dans Resend) |
| `EMAIL_FROM` | `Marchés Malins <alertes@marchesmalins.fr>` |
| `CONTACT_EMAIL` | `bonjour@marchesmalins.fr` |
| `BUSINESS_LEGAL_NAME`, `BUSINESS_SIRET`, `BUSINESS_ADDRESS` | comme FichePilote |
| `STRIPE_SECRET_KEY` | la même clé live |
| `GOOGLE_PLACES_API_KEY` | la même |

Deploy → Settings → Deployment Protection → désactiver Vercel Authentication → Domains → ajouter `marchesmalins.fr` (apex principal, www redirigé).

## 4. Vérifier
`/admin` → se connecter → ouvrir `/api/admin/health` : tout doit être `ok`, et `boamp` doit afficher un exemple d'avis.
Puis `/api/admin/stripe-setup` → copier le bloc de variables dans Vercel → Redeploy.
Dans `/admin` : cliquer « Rattrapage » plusieurs fois jusqu'à « Rattrapage terminé ✅ » (charge tous les marchés encore ouverts, ~100 départements), puis vérifier `/marches/83`.

## 5. Tâches automatiques (cron-job.org)
| URL | Fréquence |
|---|---|
| `https://marchesmalins.fr/api/cron/ingest?key=CRON_SECRET` | toutes les 6 h |
| `https://marchesmalins.fr/api/cron/digest?key=CRON_SECRET` | tous les jours 7h30 et 8h30 (Paris) |
| `https://marchesmalins.fr/api/cron/prospect?key=CRON_SECRET` | toutes les heures, lun-ven 7h-18h (quand la prospection est prête) |
| `https://marchesmalins.fr/api/cron/outreach?key=CRON_SECRET` | toutes les 20 min, lun-ven 8h-18h (quand la prospection est prête) |

## 6. Prospection (étape 2)
Domaine secondaire + boîte Workspace + SPF/DKIM/DMARC (comme fichepilote-pro.fr), puis :
`OUTREACH_SMTP_HOST=smtp.gmail.com`, `OUTREACH_SMTP_USERS`, `OUTREACH_SMTP_PASSWORDS`, `OUTREACH_SENDER_NAME=Mattéo — Marchés Malins`, `OUTREACH_DAILY_LIMIT_PER_BOX=10`, `OUTREACH_ENABLED=1`.
Tant que `OUTREACH_ENABLED` n'est pas à 1, aucun email de prospection ne part.
