# Routine — Driver Individual Reports

**Name**: `DSPilot — Driver Reports`
**Environment**: `DSPilot Reports`
**Repository**: `0xRodven/DSPilot`, branch `main`
**Trigger**: Schedule — `Weekly` le lundi à `13:00` heure locale.
La semaine vient de se terminer et les livreurs ont le temps de
consulter leur rapport en début de semaine.
**Connectors**: aucun

## Ce que fait cette routine

Pour chaque livreur actif de la semaine précédente (~40 livreurs),
génère un rapport individuel avec analyse IA personnalisée, puis stocke
dans la table Convex `driverReports`.

## Prompt à coller

```text
Tu es la routine DSPilot Driver Reports pour la station FR-PSUA-DIF1.

Ton job : générer un rapport personnel pour chaque livreur actif la
semaine dernière.

=== Étape 1 — Déterminer la semaine ===

La semaine cible = celle qui vient de se terminer dimanche soir.

  YEAR=$(date +%Y)
  YESTERDAY=$(date -d yesterday +%Y-%m-%d)
  WEEK=$(npx tsx -e "
    const d = new Date('$YESTERDAY' + 'T12:00:00Z');
    const year = d.getUTCFullYear();
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const week1Sunday = new Date(jan1);
    week1Sunday.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay());
    const diffDays = Math.floor((d.getTime() - week1Sunday.getTime()) / 86400000);
    console.log(Math.floor(diffDays / 7) + 1);
  ")

=== Étape 2 — Fetch ===

  npx tsx scripts/routines/fetch-drivers.ts --year $YEAR --week $WEEK

Exit codes : 0 OK, 1 no-data (stop gracefully), 2 config error.

Le fichier .artifacts/routines/drivers-$YEAR-w$WEEK.json contient
data.drivers (un tableau de ~40 objets avec driverId, driverName,
dwcPercent, rank, history, dailyPerformance, etc.)

=== Étape 3 — Analyser chaque livreur ===

Pour CHAQUE driver dans data.drivers, produis une synthèse IA courte
(2 paragraphes <p>) :

Paragraphe 1 — Performance perso :
- Son DWC% de la semaine et son rang (ex: "76.2% — rang 18/42")
- Son évolution vs semaine précédente (dwcChange si présent)
- Nombre de jours travaillés (daysWorked), colis livrés
  (totalDeliveries)
- Tendance sur 4 semaines (history)

Paragraphe 2 — Points d'amélioration (action perso) :
- Erreur principale (errorBreakdown : contactMiss / photoDefect / rts)
- DNR si dnrCount > 0
- Conseil d'action concret pour lui — PAS de généralités. Ex:
  "Penser à sonner systématiquement avant de déposer en BAL."

Règles dures :
- PAS de comparaison avec les autres livreurs. C'est PERSONNEL.
- Ton encourageant si DWC > 90%, factuel et direct si < 88%.
- JAMAIS les labels Fantastic/Great/Fair/Poor.
- Max 150 mots par paragraphe. Langue : français.
- Citer SES chiffres à lui, pas ceux de la station.

Pour chaque driver, écris un fichier
.artifacts/routines/driver-ai/${driverId}.json :

  {"aiSummary":"<p>Paragraphe 1</p><p>Paragraphe 2</p>"}

Tu peux traiter les livreurs en parallèle avec plusieurs appels
rapides, mais préfère séquentiel pour contrôler le coût.

=== Étape 4 — Render + store en bulk ===

  mkdir -p .artifacts/routines/driver-ai
  # (les fichiers ai ont été écrits à l'étape 3)

  npx tsx scripts/routines/render-drivers.ts \
    --year $YEAR --week $WEEK \
    --ai-dir .artifacts/routines/driver-ai

Attendu : `SUCCESS N driver reports stored for S$WEEK/$YEAR` où N ≈ 40.

=== Étape 5 — Rapporter ===

  echo \"DONE driver reports S$WEEK/$YEAR — stored in Convex prod\"
  echo \"session: https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID}\"
```

## Coût estimé

- 1 routine run = 1 crédit routine
- ~40 analyses LLM dans la même session ≈ 40 × ~500 tokens in + 300
  tokens out = raisonnable, tout en 1 session Claude
- Durée : ~10-15 min par run

## Test

Avant d'activer :
1. Créer en pause (toggle Repeats OFF).
2. Run now. Suivre la session — elle doit boucler sur les 40+ livreurs
   et stocker le résultat dans `driverReports` Convex.
3. Vérifier en prod :

   ```bash
   ssh openclaw 'export CONVEX_DEPLOY_KEY=$(grep "^CONVEX_DEPLOY_KEY=" /root/.secrets/dspilot.env | cut -d= -f2-); cd /root/DSPilot && npx convex data driverReports --limit 100 | wc -l'
   ```

   Doit retourner ~40+.
4. Si OK → activer le schedule + `sudo systemctl disable --now dspilot-driver-reports.timer` sur le VPS.

## UI — afficher les rapports livreurs dans le dashboard

Actuellement `/dashboard/reports` n'affiche que les `reportDeliveries`.
Il faudra ajouter une section ou une page pour lister les
`driverReports`. C'est hors scope de cette migration — à prévoir en
complément.
