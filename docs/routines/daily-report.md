# Routine — Daily Station Report

**Name**: `DSPilot — Daily Report`
**Environment**: `DSPilot Reports` (voir [README](./README.md))
**Repository**: `0xRodven/DSPilot`, branch `main`
**Trigger**: Schedule — `Daily` à `06:00` heure locale (1h30 après le
scrape VPS de 04:30 UTC, donne le temps aux data d'Amazon d'être
ingérées).
**Connectors**: aucun

## Prompt à coller

```text
Tu es la routine DSPilot Daily Report pour la station FR-PSUA-DIF1.

Ton job : générer le rapport quotidien pour HIER. Si la data Amazon
n'est pas encore disponible, tu t'arrêtes proprement sans générer de
rapport vide.

=== Étape 1 — Fetch data ===

Lance :

  export YESTERDAY=$(date -d yesterday +%Y-%m-%d)
  npx tsx scripts/routines/fetch-daily.ts --date $YESTERDAY

Lis le code de sortie :
- 0 → le fichier .artifacts/routines/daily-$YESTERDAY.json est prêt
- 1 → NO DATA. Tu t'arrêtes immédiatement en affichant :
      `SKIPPED: no-data for $YESTERDAY`
      C'est normal certains jours (dimanches ou Amazon pas encore publié).
- 2 → erreur de config. Arrête et rapporte l'erreur.

=== Étape 2 — Analyser la data ===

Lis le JSON dans .artifacts/routines/daily-$YESTERDAY.json. Produis
une synthèse HTML en 2 paragraphes `<p>` :

Paragraphe 1 — KPIs et vue d'ensemble :
- DWC moyen du jour (kpis.avgDwc) + évolution vs veille (kpis.dwcChange
  si présent)
- Nombre de livreurs actifs (kpis.activeDrivers)
- Total colis livrés (kpis.totalDelivered)
- Nombre d'incidents (kpis.incidents)

Paragraphe 2 — Alertes et actions :
- Livreurs en alerte (isAlert = true dans data.drivers) : les citer par
  nom avec leur DWC%
- DNR du jour (data.dnr.newConcessions) + livreurs les plus concernés
  (data.dnr.topDrivers)
- Photo defects s'il y en a
- Investigations actives si data.dnr.investigationsActive > 0

Règles dures :
- JAMAIS inventer de chiffres. Si un champ est à 0 ou vide, dire "aucun"
  ou ne pas le mentionner.
- JAMAIS utiliser les labels Fantastic/Great/Fair/Poor. Uniquement des
  pourcentages.
- Max 180 mots par paragraphe. Ton factuel, bref, chiffré.

Écris ta synthèse dans un fichier .artifacts/routines/ai-daily.json au
format EXACT (une seule ligne JSON) :

  {"aiSummary":"<p>Paragraphe 1...</p><p>Paragraphe 2...</p>"}

=== Étape 3 — Render + store ===

Lance :

  npx tsx scripts/routines/render-daily.ts \
    --date $YESTERDAY \
    --ai-file .artifacts/routines/ai-daily.json

Vérifie que la sortie contient `SUCCESS $YESTERDAY`. Si erreur, affiche
le log complet.

=== Étape 4 — Rapporter la session ===

Affiche en dernier :
  DONE daily report $YESTERDAY — stored in Convex prod
  session: https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID}
```

## Ce qu'il va se passer

- Le run clone le repo frais, exécute `npm ci` (depuis le cache), lance
  fetch-daily, analyse le JSON natively, lance render-daily qui stocke
  le HTML dans Convex prod via `api.reporting.storeReport`.
- Durée attendue : ~2-3 min par run.
- Credits consommés : 1 crédit routine + la session Claude (compte
  dans ton quota Max).

## Test avant d'activer

1. Créer la routine en gardant **Repeats toggle OFF**.
2. Sur la page détail de la routine, cliquer **Run now**.
3. Suivre la session qui s'ouvre. Elle doit produire un rapport dans
   Convex pour la date d'hier (ou afficher SKIPPED si pas de data).
4. Vérifier dans `/dashboard/reports` du site prod que le rapport
   apparaît avec le titre `Rapport Quotidien — <Jour> <date>`.
5. Si OK → activer le toggle Repeats. Désactiver Step 5 du
   `run-amazon-unified.sh` (ajouter `--skip-report` à la commande
   systemd).
