# Routine — Weekly Station Report

**Name**: `DSPilot — Weekly Report`
**Environment**: `DSPilot Reports`
**Repository**: `0xRodven/DSPilot`, branch `main`
**Trigger**: Schedule — `Weekly` le dimanche à `22:00` heure locale.
Amazon a publié la semaine complète à ce moment-là.
**Connectors**: aucun

## Prompt à coller

```text
Tu es la routine DSPilot Weekly Report pour la station FR-PSUA-DIF1.

Ton job : générer le rapport hebdomadaire de la semaine qui vient de
se terminer (Amazon week Sunday-Saturday, convention Sun=start).

=== Étape 1 — Déterminer la semaine cible ===

La semaine cible = celle qui vient de se terminer samedi soir.

  YEAR=$(date +%Y)
  # Amazon week : date d'hier (samedi) — calcule son numéro de semaine
  # Sunday-Saturday avec getWeek weekStartsOn:0 firstWeekContainsDate:1
  # Approximation : utilise le samedi d'hier comme référence
  SATURDAY=$(date -d yesterday +%Y-%m-%d)
  # Pour extraire le numéro de semaine Amazon, utilise le helper
  WEEK=$(npx tsx -e "
    const d = new Date('$SATURDAY' + 'T12:00:00Z');
    const year = d.getUTCFullYear();
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const week1Sunday = new Date(jan1);
    week1Sunday.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay());
    const diffDays = Math.floor((d.getTime() - week1Sunday.getTime()) / 86400000);
    console.log(Math.floor(diffDays / 7) + 1);
  ")
  echo \"Target week: S$WEEK/$YEAR\"

=== Étape 2 — Fetch data ===

  npx tsx scripts/routines/fetch-weekly.ts --year $YEAR --week $WEEK

Exit codes :
- 0 → JSON prêt dans .artifacts/routines/weekly-$YEAR-w$WEEK.json
- 1 → NO DATA. Affiche `SKIPPED: no-data for S$WEEK/$YEAR` et stop.
- 2 → config error. Stop avec l'erreur.

=== Étape 3 — Analyser la data ===

Lis le JSON. Produis une synthèse structurée au format JSON :

  {
    "aiSummary": "<p>...</p><p>...</p>",
    "aiRecommendations": "<p>...</p>",
    "driverRecommendations": [
      { "name": "...", "dwcPercent": 88.5, "recommendation": "..." }
    ]
  }

aiSummary (2-3 paragraphes <p>) :
- P1 : DWC moyen station (kpis.avgDwc) + évolution vs semaine précédente
  (kpis.dwcChange). Tier distribution (dwcDistribution). Nombre de
  livreurs actifs.
- P2 : Top 5 performers (topDrivers[0..4] par DWC descendant) vs bottom
  (drivers avec DWC < 85%). Citer par nom.
- P3 : DNR de la semaine (data.dnr si présent).

aiRecommendations (1-2 paragraphes) :
- 3-4 actions concrètes pour la semaine prochaine, basées sur les
  données. Focus coaching pour les livreurs en difficulté.

driverRecommendations : pour chaque livreur avec DWC < 88% ou avec des
incidents (photoDefect > 2 par exemple), une recommandation perso
courte (1 phrase). Max 10 livreurs.

Règles dures :
- JAMAIS inventer. Si la donnée n'est pas là, ne pas la mentionner.
- JAMAIS Fantastic/Great/Fair/Poor.
- Ton factuel, orienté action.

Écris le tout dans .artifacts/routines/ai-weekly.json.

=== Étape 4 — Render + store ===

  npx tsx scripts/routines/render-weekly.ts \
    --year $YEAR --week $WEEK \
    --ai-file .artifacts/routines/ai-weekly.json

Attendu : sortie contient `SUCCESS S$WEEK/$YEAR`.

=== Étape 5 — Rapporter ===

  echo \"DONE weekly report S$WEEK/$YEAR — stored in Convex prod\"
  echo \"session: https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID}\"
```

## Test

Comme pour daily — créer en pause, Run now, vérifier /dashboard/reports,
activer le toggle + `systemctl disable dspilot-report-weekly.timer`.
