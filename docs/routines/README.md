# DSPilot Claude Code Routines

Cette doc contient tout ce qu'il faut pour créer les 3 routines DSPilot
sur [claude.ai/code/routines](https://claude.ai/code/routines).

## Architecture — rappel

Le VPS `openclaw` garde la partie scraping Amazon (browser nodriver +
cookies stealth — impossible à migrer ailleurs). Les routines Claude
Cloud prennent en charge **tout ce qui est IA + génération de
rapports**, en se branchant directement sur Convex prod via HTTP.

```
[VPS openclaw — scraper only]
  ├─ dspilot-amazon-unified.timer (04:30 UTC daily)
  │   └─ Step 1-4: scrape Amazon → ingest Convex
  │   └─ Step 5 (DÉSACTIVÉ après migration routines)
  ├─ dspilot-amazon-health.timer
  └─ dspilot-amazon-session-refresh.timer

[Claude Cloud — routines]
  ├─ daily-report        (schedule: 06:00 UTC daily = après scrape)
  ├─ weekly-report       (schedule: Sunday 20:00 UTC)
  └─ driver-reports      (schedule: Monday 11:00 UTC)
```

## Environment à créer (UNE fois, partagé par les 3 routines)

Sur [claude.ai/code/routines](https://claude.ai/code/routines) →
Environments → **Add environment** :

- **Name** : `DSPilot Reports`
- **Network access** : **Custom**
  - Include default list of common package managers : ✅
  - Allowed domains (une par ligne) :
    ```
    sincere-rhinoceros-718.convex.cloud
    api.anthropic.com
    ```
- **Environment variables** :
  ```
  NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud
  CONVEX_DEPLOY_KEY=prod:sincere-rhinoceros-718|…
  DSPILOT_STATION_CODE=FR-PSUA-DIF1
  ```
  (Copier `CONVEX_DEPLOY_KEY` depuis `ssh openclaw 'cat /root/.secrets/dspilot.env | grep CONVEX_DEPLOY_KEY'`)
- **Setup script** :
  ```bash
  #!/bin/bash
  npm ci
  ```
  Le cache env est gardé ~7 jours, donc l'install `npm ci` ne re-tourne
  pas à chaque run — seulement sur la première session + re-builds
  occasionnels.

## Les 3 prompts

Chaque routine utilise :
- **Repo** : `0xRodven/DSPilot`, default branch `main`
- **Environment** : `DSPilot Reports` (celui créé ci-dessus)
- **Connectors** : aucun (on utilise uniquement le Convex HTTP direct)

Voir :
- [`daily-report.md`](./daily-report.md) — rapport quotidien station
- [`weekly-report.md`](./weekly-report.md) — rapport hebdo station
- [`driver-reports.md`](./driver-reports.md) — rapports individuels livreurs

## Plan de test (minimise la consommation de crédits)

1. **Valider en local** (0 crédit) : les scripts `scripts/routines/*.ts`
   tournent sur le VPS avec les mêmes env vars. Déjà testés end-to-end
   (daily Apr 16, weekly S16, drivers S16 → 56 rapports stockés).

2. **Créer les routines en pause** (0 crédit) : dans l'UI Claude Code,
   créer la routine mais **désactiver le toggle Repeats** juste après
   création. Le schedule ne tire pas.

3. **"Run now" manuel 1 fois** (1 crédit) : sur la page de détail de la
   routine, clic **Run now**. Suivre la session qui s'ouvre, vérifier
   les logs, confirmer qu'un rapport apparaît dans Convex.

4. **Activer le schedule + désactiver le VPS timer correspondant** :
   - Daily : `ssh openclaw 'systemctl edit dspilot-amazon-unified.service'`
     puis ajouter `--skip-report` à la commande, OU re-écrire Step 5
     pour ne plus appeler `run-daily-report.sh`.
   - Weekly : `ssh openclaw 'sudo systemctl disable --now dspilot-report-weekly.timer'`
   - Driver reports : `ssh openclaw 'sudo systemctl disable --now dspilot-driver-reports.timer'`

5. **Observer 2-3 jours** avant de supprimer les scripts bash legacy.

## Post-migration cleanup

Une fois les routines stables, supprimer du repo :
- `scripts/run-daily-report.sh`
- `scripts/run-weekly-report.sh`
- `scripts/run-driver-reports.sh`
- `scripts/generate-daily-report.ts` (le wrapper, pas le template)
- `scripts/generate-report.ts` (idem)
- `scripts/generate-driver-report.ts` (idem)

~800 lignes de bash/glue qui disparaissent. Les templates HTML
(`src/lib/pdf/*-template.ts`) restent — ils sont utilisés par les
nouveaux `scripts/routines/render-*.ts`.
