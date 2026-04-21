# Changelog

Toutes les évolutions notables sont listées ici. Format inspiré de [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.0.0] — 2026-04-21 — Pre-prod release

### Added
- Onglet "Livreurs" sur `/dashboard/reports` avec tableau unifié + recherche par nom (accent-insensitive)
- 3 routines Claude Cloud : rapport quotidien (06h UTC), hebdomadaire + livreurs (lundi 13h30 Paris)
- Split DNR detail sheet : adresse + note client + géolocalisation en blocs séparés
- Scraper DNR self-healing : retry 3× dans `fetch_detail_for_tracking` + health-check pipeline qui re-run si >10% UNKNOWN
- `.github/` : SECURITY.md, PR template, issue templates bug + feature
- `docs/TESTING.md` : guide pour testeurs externes
- `docs/ARCHITECTURE.md` : vue système complète

### Changed
- README refondu : Next.js 16 (pas 15), quick start propre, arbo claire, liens vers docs
- Cron drivers routine : dimanche 20h UTC → lundi 11h30 UTC (13h30 Paris)
- Rapports livreurs passent par un tableau central, plus embed dans page détail (UX plus cohérente)
- `listDriverReports` renvoie désormais `htmlContent` pour viewer on-demand

### Security (P0)
- `stations.getStation` force `canAccessStation` (fuite cross-tenant bouchée)
- `stations.listStations` n'accepte plus `ownerId` en input (énumération bloquée)
- Supprimé : `migrateStationCodes`, `debugDataWithAuth`, `admin.clearAllData`, `reporting.deleteReport` (tous sans auth)

### Removed
- 6 scripts legacy : `scripts/run-{daily,weekly,driver}-report.sh`, `generate-{daily,driver,}-report.ts`
- 3 systemd timers VPS : `dspilot-report-{daily,weekly,driver-reports}`
- 5 composants UI jamais importés : magic-badge, magic-card, bento-grid, border-beam, lamp
- 2 boutons morts sur `/dashboard/drivers/[id]` : Exporter PDF, Envoyer rapport WhatsApp
- 6 fichiers HANDOFF/CHEATSHEET/CHECKLIST à la racine du repo

### Fixed
- S16 DNR : 94/110 UNKNOWN → 8/110 après re-scrape (popup Amazon timing)
- Console.log oubliés sur `export-button.tsx`
- Tous les `any` éliminés au profit de `Id<...>` stricts
- Pre-commit hook biome Apple Silicon : `@biomejs/cli-darwin-arm64` ajouté en optionalDependencies

## Historique antérieur

Voir `git log --oneline` pour les commits antérieurs au 2026-04-21.
