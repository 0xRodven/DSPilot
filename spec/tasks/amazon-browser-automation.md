# Analyse: Browser Automation Amazon Logistics

## Resume

Objectif: automatiser la collecte des exports Amazon Logistics et les injecter dans DSPilot sans passer par l'UI d'import manuelle. Le lot livre un pipeline backend/admin idempotent et un CLI d'ingestion d'artifacts. Le browser agent reste le producteur de fichiers en entree.

## Findings terrain (2026-03-25)

- La page `Rapports supplementaires` est la voie la plus prometteuse:
  - elle expose deja les liens signes S3 vers `Daily-Report`, `DWC-IADC-Report` et `DNR_Investigations`
  - elle evite de reparser les tableaux React Qualite / Associe juste pour recuperer les exports
- L'historique actuel `quality_by_week` / `associates_by_week` est suspect:
  - les semaines adjacentes sont identiques dans le dataset scrape local
  - le clic "previous" des pages scorecard ne change donc probablement pas vraiment la semaine
- Le runner browser doit donc privilegier:
  1. capture du catalogue `Rapports supplementaires`
  2. telechargement des HTML signes
  3. ingestion DSPilot

## Scope Livre Dans Ce Lot

- Parser DWC/IADC reutilisable cote serveur (`parseHtmlContent`)
- Point d'entree Convex internal/admin pour ingerer un report parse
- Remplacement propre des donnees d'une semaine avant reinjection
- Regeneration des alertes apres import
- CLI `npm run amazon:ingest` pour ingester des fichiers deja telecharges
- Auto-decouverte des artifacts depuis un dossier de downloads
- Runner `npm run amazon:reports:sync` pour parser / telecharger les exports depuis `Rapports supplementaires`

## User Stories

- En tant que **worker automation**, je veux pousser un export Amazon dans DSPilot sans session Clerk
- En tant que **manager**, je veux que le reimport d'une semaine remplace proprement les anciennes stats
- En tant que **ops**, je veux pouvoir valider un lot en `--dry-run` avant ecriture en production

## Fichiers Impactes

### Fichiers modifies

| Fichier | Raison |
|---------|--------|
| `src/lib/parser/index.ts` | Ajout du parsing HTML a partir d'un contenu brut |
| `src/lib/parser/html-extractor.ts` | Decode base64 compatible browser + Node |
| `package.json` | Script CLI d'ingestion automation |

### Fichiers crees

| Fichier | Description |
|---------|-------------|
| `convex/automation.ts` | Queries/mutations/actions internes pour l'import automation |
| `scripts/amazon-logistics-sync.ts` | CLI Node pour parser les artifacts et appeler Convex en admin |

## Entrees Supportees

- `HTML` DWC/IADC Amazon
- `CSV` Delivery Overview (optionnel)
- `CSV` noms livreurs / concessions (optionnel)

## Flux Technique

1. Un browser agent telecharge les exports Amazon dans un dossier local
2. `amazon-logistics-sync.ts` detecte ou recoit explicitement les fichiers
3. Le script parse les contenus et valide la station Amazon attendue
4. Le script appelle `automation.ingestParsedAmazonReport` avec `CONVEX_DEPLOY_KEY`
5. Convex:
   - cree un import pending
   - supprime les donnees existantes de la semaine cible
   - recree drivers manquants
   - reinjecte daily + weekly + station stats + delivery metrics
   - marque l'import comme success/partial
   - regenere les alertes

## Variables D'environnement Cote Worker

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `DSPILOT_STATION_CODE`
- `DSPILOT_EXPECTED_AMAZON_STATION_CODE` (optionnel)
- `DSPILOT_DWC_HTML_PATH` (optionnel)
- `DSPILOT_DELIVERY_OVERVIEW_PATH` (optionnel)
- `DSPILOT_DRIVER_NAMES_PATH` (optionnel)
- `DSPILOT_ARTIFACTS_DIR` (optionnel)
- `DSPILOT_AUTOMATION_IMPORTED_BY` (optionnel)

## Commandes

```bash
source /root/.secrets/dspilot.env
cd /root/DSPilot

# Parser un HTML local de Rapports supplementaires
npm run amazon:reports:sync -- \
  --html-path scraper/data/deep/supplementary_reports.html \
  --no-download

# Validation sans ecriture
npm run amazon:ingest -- \
  --station-code DIF1 \
  --artifacts-dir /tmp/amazon-downloads \
  --expected-amazon-station-code DIF1 \
  --dry-run

# Injection Convex
npm run amazon:ingest -- \
  --station-code DIF1 \
  --artifacts-dir /tmp/amazon-downloads \
  --expected-amazon-station-code DIF1
```

## Risques Restants

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Le vrai rapport "Associe de livraison" n'est pas encore parse specifiquement | Donnees daily DNR potentiellement manquantes | Capturer / telecharger d'abord les vrais `Daily-Report` depuis `Rapports supplementaires`, puis parser ces HTML reels |
| Le code station DSPilot peut differer du code station Amazon | Import dans la mauvaise station | Conserver `--station-code` DSPilot et `--expected-amazon-station-code` Amazon distincts |
| La navigation historique des scorecards React est potentiellement fausse | Faux historique, faux insights | Considerer les tableaux scorecard comme read-only / debug, et s'appuyer sur les rapports telechargeables |
| Le browser agent n'est pas encore cable en cron | Download manuel/ops encore necessaire | Ajouter un worker permanent OpenClaw qui lance `amazon:reports:sync` puis `amazon:ingest` |

## Etape Suivante

Ajouter un runner de collecte Amazon qui:

1. ouvre Amazon Logistics
2. ouvre `Rapports supplementaires`
3. telecharge les HTML signes (`Daily-Report`, `DWC-IADC-Report`, `DNR_Investigations`)
4. depose les fichiers dans un dossier timestamped
5. appelle `npm run amazon:ingest`
6. envoie le recap ops si l'import echoue
