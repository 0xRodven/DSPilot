# DSPilot

> SaaS de gestion de performance livreurs pour les Amazon DSP (Delivery Service Partners).

Dashboard temps-réel pour les managers de station Amazon Logistics : suivi DWC/IADC, coaching livreurs, détection DNR, rapports IA automatisés (quotidien + hebdomadaire + individuel).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 + shadcn/ui |
| Backend | Convex (temps-réel, serverless) |
| Auth | Clerk (multi-tenant, 1 org = 1 station) |
| Scraping | Python + nodriver (VPS Hetzner, systemd timers) |
| Rapports IA | Claude Opus 4.7 via Claude Code Routines (cloud) |
| Deploy | Vercel (frontend) + Convex prod + VPS (scraper) |

## Quick start

```bash
git clone git@github.com:0xRodven/DSPilot.git && cd DSPilot
npm install
cp .env.example .env.local          # puis remplir les clés Clerk + Convex
npm run dev                          # Next.js (port 3005) + Convex dev
```

→ [http://localhost:3005](http://localhost:3005)

## Commandes

| Commande | Usage |
|---|---|
| `npm run dev` | Next.js + Convex en parallèle |
| `npm run build` | Build production |
| `npm run check` | Biome lint + format check |
| `npm run check:fix` | Biome auto-fix |
| `npx tsc --noEmit` | Type check |
| `npx convex deploy` | Deploy Convex prod (**attention : vérifier `CONVEX_DEPLOY_KEY`**) |

## Architecture

```
DSPilot/
├── src/
│   ├── app/(main)/dashboard/     # Routes protégées
│   │   ├── page.tsx              # KPIs + top drivers
│   │   ├── drivers/              # Liste + fiche détail livreur
│   │   ├── dnr/                  # Did Not Receive avec map + note client
│   │   ├── coaching/             # Actions coaching + calendrier
│   │   ├── reports/              # Hebdo / Quotidien / Livreurs
│   │   ├── import/               # Upload rapports Amazon HTML
│   │   ├── warnings/             # Avertissements actifs
│   │   ├── stats/                # Stats station agrégées
│   │   └── settings/             # Paramètres org/station
│   ├── components/               # UI (shadcn + métier)
│   └── lib/                      # store Zustand, filtres nuqs, utils
├── convex/
│   ├── schema.ts                 # 15+ tables multi-tenant (toutes avec stationId)
│   ├── stations.ts               # CRUD + isolation (canAccessStation)
│   ├── drivers.ts                # Queries/mutations livreurs
│   ├── stats.ts                  # KPIs, dailyStats, weeklyStats
│   ├── dnr.ts                    # Concessions Amazon + investigations
│   ├── coaching.ts               # Pipeline coaching + escalade
│   ├── reporting.ts              # Rapports station + livreurs
│   └── lib/permissions.ts        # RBAC Clerk → Convex
├── scripts/
│   ├── routines/                 # fetch-*.ts + render-*.ts (utilisés par routines cloud)
│   ├── run-amazon-unified.sh     # Pipeline scrape quotidien (VPS cron 04h30 UTC)
│   └── run-concessions-pipeline.sh # Pipeline DNR avec health-check auto
├── scraper/                      # Python — Amazon Logistics scraper
└── docs/
    ├── routines/                 # Setup 3 routines cloud (daily/weekly/drivers)
    ├── TESTING.md                # Guide pour testeurs externes
    └── superpowers/              # Scripts internes
```

## Environnement

Fichier `.env.local` requis. Voir `.env.example`. Clés essentielles :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | URL du déploiement Convex |
| `CONVEX_DEPLOY_KEY` | Clé admin Convex (prod ou dev) |
| `CLERK_SECRET_KEY` | Secret Clerk backend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk |

## Règles critiques

Semaines Amazon = **dimanche → samedi** (pas ISO). Utiliser `getWeek/getWeekYear` avec `{ weekStartsOn: 0 }`, jamais `getISOWeek`.

Multi-tenant : toute query Convex lisant une table sensible DOIT appeler `canAccessStation(ctx, stationId)`. Les mutations sensibles doivent utiliser `requireOwner` ou `requireWriteAccess`.

Import : jamais >1 semaine d'un coup.

Voir [`.claude/rules/`](.claude/rules/) pour le détail.

## Déploiement

Vercel auto-deploy sur push `main`.
Convex prod via `npx convex deploy` depuis VPS ou Mac avec `CONVEX_DEPLOY_KEY=prod:...`.

Les 3 routines cloud Claude tournent sur schedule (voir [`docs/routines/`](docs/routines/)).

## Documentation

- [CLAUDE.md](CLAUDE.md) — guide interne Claude Code
- [CONTRIBUTING.md](CONTRIBUTING.md) — convention commit, review
- [SECURITY.md](.github/SECURITY.md) — reporting vulnérabilités
- [docs/TESTING.md](docs/TESTING.md) — guide testeur externe
- [docs/routines/README.md](docs/routines/README.md) — routines IA automatisées

## License

Propriétaire — tous droits réservés Ousmane Thienta.
