# Architecture DSPilot

Vue système complète. À lire avant toute modif structurelle.

## Flux de données (end-to-end)

```
Amazon Logistics (web)
        ↓  scrape HTML/CSV
VPS Hetzner (Python + nodriver)
        ↓  ingest Convex mutations
Convex prod (sincere-rhinoceros-718)
        ↓  real-time subscriptions
Next.js App (Vercel) ←— Clerk Auth (orgs)
        ↓  affichage
Manager (browser)
```

En parallèle, **3 routines Claude Cloud** tournent sur schedule :
1. **Daily** 06h UTC — rapport station du jour précédent
2. **Weekly** Lundi 11h30 UTC — rapport station de la semaine finie
3. **Drivers** Lundi 11h30 UTC — rapport individuel de chaque livreur (batch de 5)

Elles queries Convex → Opus analyse JSON → render HTML → store Convex.

## Multi-tenant

**Règle** : 1 organisation Clerk = 1 station Convex.

Toutes les tables Convex ont un `stationId: v.id("stations")`. Chaque query/mutation sensible appelle `canAccessStation(ctx, stationId)` qui vérifie :
1. `ctx.auth.getUserIdentity()` — user authentifié
2. `identity.org_id === station.organizationId` — user dans la bonne org

Exceptions : mutations bootstrap (`getOrCreateStationForCurrentOrg`) vérifient juste l'org Clerk.

## Modules Convex

| Fichier | Responsabilité |
|---|---|
| `schema.ts` | Définition des 15+ tables + indexes |
| `stations.ts` | CRUD station, isolation d'accès |
| `drivers.ts` | Livreurs + bulkUpsert + phone/whatsapp |
| `stats.ts` | dailyStats / weeklyStats / stationWeeklyStats |
| `dnr.ts` | Concessions Amazon + investigations |
| `coaching.ts` | Actions coaching + pipeline escalade |
| `warnings.ts` | Avertissements formels |
| `reporting.ts` | Rapports station (daily/weekly) + livreur |
| `imports.ts` | Lifecycle imports Amazon (parsing → ingest) |
| `whatsapp.ts` | Actions Twilio pour WhatsApp recap |
| `http.ts` | Webhook Clerk user.created → provisioning |
| `lib/permissions.ts` | `canAccessStation`, `requireOwner`, `requireWriteAccess` |
| `lib/utils.ts` | `slugify`, helpers dates |

## Modules UI critiques

| Composant | Rôle |
|---|---|
| `OrgStationSync` | Sync Clerk org ↔ Convex station dans Zustand |
| `FilterInitializer` | Init filtres nuqs (semaine courante + station) |
| `useFilters()` | Hook URL filters (year, week, period, range) |
| `useDashboardStore` | Zustand : selectedStation |
| `DriverHeader` | Fiche livreur haut de page |
| `DnrDetailSheet` | Sheet latéral avec map + note client |
| `DriverReportsTable` | Tableau rapports livreurs avec search |

## Scraper VPS

3 systemd timers actifs (`dspilot-amazon-*`) :
- `dspilot-amazon-unified.timer` — 04h30 UTC quotidien, scrape + ingest Amazon data
- `dspilot-amazon-health.timer` — toutes les heures, healthcheck session
- `dspilot-amazon-session-refresh.timer` — toutes les 12h, refresh cookies

Scraper Python utilise `nodriver` (Chrome stealth) + BeautifulSoup. Auth via cookies exportés du vrai browser (pas de login automatique).

## Conventions code

- **Semaines Amazon** : dimanche → samedi (pas ISO). `getWeek(date, { weekStartsOn: 0 })`.
- **TypeScript strict** : jamais `any`, toujours `Id<"table">`, `"skip"` pour queries conditionnelles.
- **Styling** : Tailwind + shadcn/ui uniquement. Pas de CSS modules.
- **State serveur** : Convex queries (jamais `useState` pour data persistante).
- **Formattage** : Biome (pas ESLint/Prettier). `npm run check`.

## Performance

- Queries Convex utilisent toujours un index (pas de `.collect()` sans `withIndex`).
- Pattern `"skip"` pour éviter les queries avec args incomplets.
- Images : Next.js Image component.
- Font loading : `next/font` (subset Latin).

## Environnements

| Env | Convex | Clerk | Vercel |
|---|---|---|---|
| Dev (Mac) | `pastel-snail-181` | `pk_test_*` | localhost:3005 |
| Prod | `sincere-rhinoceros-718` | `pk_live_*` | dspilot.fr |

## Secrets

- Mac : `.env.local` (gitignored) + `~/.openclaw/...` pour VPS SSH
- VPS : `/root/.secrets/dspilot.env` (chmod 600)
- Vercel : env vars via dashboard (scope Production / Preview)
- Clerk : Dashboard Clerk (webhooks signing secret)
