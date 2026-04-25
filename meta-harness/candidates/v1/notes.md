# Candidate v1 — metrics-sources skill

## Failure mode observé (baseline v0, 10/15 = 0.667)

Sur les 5 échecs, **4 sont des erreurs de source de données** où l'agent a tiré un chiffre d'une vue dérivée (`reporting:getReportData`) ou d'un champ pré-agrégé (`driverWeeklyStats.dwcBreakdown.contactMiss`) au lieu de la table brute autorative :

- **q01_dif1_dnr_s16** : agent a répondu `76 entrées (70 concessions + 6 investigations)` en ne lisant que `dnrInvestigations`. Le regex attendait `102` — l'agent a raté ~26 entrées. Hypothèse : limite `--limit 500` sur `npx convex data`, pas de pagination, et/ou `dsp_delivery_concessions` n'est pas la même table que `dnrInvestigations` dans l'esprit user.

- **q02_dif1_colis_s16** : agent a répondu `23 030 colis livrés` via `reporting:getReportData.kpis` / somme `drivers[].totalDeliveries`. Attendu `22 337`. La vraie source est `stationDeliveryStats` (`metricName="Colis livrés"`, `numericValue`) — schéma à `convex/schema.ts:262-275`.

- **q09_top_contact_miss_s16** : agent a répondu `Salim Berrahail — 143 CM` en sortant `driverWeeklyStats.dwcBreakdown.contactMiss`. Attendu `Hassane Coulibaly Camara — 116`. Dans le vocabulaire partner-report (cf. memory `feedback_report_partner_v2`), "Contact Miss" ≡ DNR attribuée au livreur — donc il faut compter `dnrInvestigations` par `driverId`, PAS tirer le breakdown DWC (qui compte des events techniques, potentiellement dupliqués avec Photo Defect).

- **q12_dif1_colis_s15** : agent a répondu `13 555 colis` via `reporting:getReportData`. Attendu `19 246`. Même pattern que q02 — mauvaise source.

(q11_tier_poor off-by-one `46` vs `47` — écart différent, pas adressé par cette itération ; probable boundary inclusif/exclusif sur 88%.)

## Hypothèse de cause

Le harness baseline donne à l'agent une liste de tables disponibles (`query-convex-prod` skill) mais **aucune mapping metric → table source**. L'agent choisit la première vue qui "ressemble" (souvent `reporting:getReportData` parce qu'elle est évoquée dans `dspilot-query-stats` et `dspilot-driver-detail`) au lieu de la table brute. Résultat : il hit systématiquement des vues agrégées qui ont des définitions légèrement différentes (attempts vs delivered, breakdown DWC vs DNR).

## Modification proposée (atomique)

1. Nouveau skill `skills/dspilot-metrics-sources.md` : table de correspondance `metric demandée → table Convex authoritative`, avec :
   - Warning explicite que `reporting:getReportData` est une vue dérivée et diverge parfois
   - Précision terminologique "Contact Miss" (partner-report) ≠ `dwcBreakdown.contactMiss` (technique)
   - Exemples bash prêts à copier pour `stationDeliveryStats` et comptage DNR par driver
   - Rappel pagination `--limit 2000` pour tables volumineuses

2. Une ligne ajoutée à `CLAUDE.md` pour forcer la consultation du skill avant toute réponse chiffrée.

**Aucun chiffre de l'eval-set n'est copié** — le skill ne contient que du mapping schéma + vocabulaire. Les exemples montrent la structure de commande, pas les réponses.

## Pourquoi ça devrait aider

- **q01, q02, q12** : l'agent saura qu'il faut aller directement à `stationDeliveryStats` / paginer `dnrInvestigations`, au lieu de faire confiance à `reporting:getReportData.kpis`.
- **q09** : l'agent distinguera `dwcBreakdown.contactMiss` (DWC technique) vs DNR partner-report, et comptera par `driverId` dans `dnrInvestigations`.
- Risque à surveiller : l'agent pourrait devenir plus verbeux en citant les deux sources. Le style Telegram court reste dicté par `CLAUDE.md` donc normalement borné.

Coûts attendus : +1 skill (~3 Ko), ~+5% tokens session-start si le skill se charge via Skill tool. Latence : potentiellement + 1 appel Convex supplémentaire pour le cross-check.

DONE candidate=v1 hypothesis=Mapper chaque métrique à sa table Convex brute (stationDeliveryStats/dnrInvestigations) au lieu de reporting:getReportData devrait corriger q01/q02/q09/q12
