# Weekly Report Generation — Claude Scheduled Agent

## TASK
Génère le rapport hebdomadaire de la station DIF1 avec analyse IA complète.

## STEPS

### 1. Récupérer les données
```bash
source .env.secrets
CONVEX_DEPLOYMENT="dev:pastel-snail-181" npx convex run reporting:getReportData '{"stationCode":"FR-PSUA-DIF1","year":YEAR,"week":WEEK}'
```
Remplace YEAR et WEEK par la semaine en cours (ou la dernière semaine avec données).

### 2. Analyser les données
À partir du JSON retourné, extrais :
- `kpis` : avgDwc, avgIadc, totalDelivered, activeDrivers
- `dwcDistribution` : above95, pct90to95, pct85to90, pct80to85, below80
- `drivers` : liste triée par rank (name, dwcPercent, dwcTrend, iadcPercent, totalDeliveries, daysWorked)
- `weeklyHistory` : tendance DWC sur 8 semaines

### 3. Générer l'analyse IA
Écris un fichier JSON `.artifacts/reports/ai-sWEEK-YEAR.json` avec cette structure :

```json
{
  "aiSummary": "<p><strong>Résumé de la semaine...</strong></p><p>Analyse des tendances...</p>",
  "aiRecommendations": "<ol><li><strong>Action 1</strong> — détail...</li>...</ol>",
  "driverRecommendations": [
    {
      "name": "AMAZON_ID",
      "recommendation": "Action concrète à prendre.",
      "why": "Raison factuelle basée sur les données."
    }
  ]
}
```

**Règles pour l'analyse :**
- `aiSummary` : HTML, 2-3 paragraphes. DWC moyen, tendance vs semaine précédente, faits marquants, alertes.
- `aiRecommendations` : HTML `<ol>`, 3-5 recommandations stratégiques pour le manager. Concrètes et actionnables.
- `driverRecommendations` : 4-8 livreurs max. Cibler les livreurs en chute (>3pp de baisse), sous 85%, et les top performers à féliciter. Pas de livreurs avec <30 colis (stats non significatives).

### 4. Générer le rapport
```bash
source .env.secrets
export NEXT_PUBLIC_CONVEX_URL CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY_DEV"
npx tsx scripts/generate-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year YEAR --week WEEK \
  --ai-file .artifacts/reports/ai-sWEEK-YEAR.json \
  --skip-telegram
```

### 5. Vérifier
Le script doit afficher :
- `AI content loaded — X driver recommendations`
- `stored in Convex ✓`

## SUCCESS CRITERIA
- Rapport stocké dans Convex avec analyse IA
- Visible sur /dashboard/reports quand on sélectionne la semaine
