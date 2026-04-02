# Daily Report Generation — Claude Scheduled Agent

## TASK
Génère le rapport quotidien de la station DIF1 avec analyse IA.

## STEPS

### 1. Récupérer les données
```bash
source .env.secrets
CONVEX_DEPLOYMENT="dev:pastel-snail-181" npx convex run reporting:getReportData '{"stationCode":"FR-PSUA-DIF1","year":YEAR,"week":WEEK}'
```
Utilise l'année et la semaine ISO en cours.

### 2. Analyser les données
Même extraction que le weekly — kpis, distribution, drivers, tendances.

### 3. Générer l'analyse IA
Écris `.artifacts/reports/ai-daily-YEAR-MM-DD.json` :

```json
{
  "aiSummary": "<p><strong>Point du jour...</strong></p><p>Analyse rapide...</p>",
  "aiRecommendations": "<ol><li><strong>Action urgente</strong> — détail...</li></ol>",
  "driverRecommendations": [
    {
      "name": "AMAZON_ID",
      "recommendation": "Action pour aujourd'hui.",
      "why": "Raison factuelle."
    }
  ]
}
```

**Règles daily :**
- `aiSummary` : 1-2 paragraphes courts. Focus sur les urgences du jour.
- `aiRecommendations` : 2-3 actions max. Ce que le manager doit faire AUJOURD'HUI.
- `driverRecommendations` : 3-5 livreurs max. Que les cas critiques et les baisses du jour.

### 4. Générer le rapport
```bash
source .env.secrets
export NEXT_PUBLIC_CONVEX_URL CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY_DEV"
npx tsx scripts/generate-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year YEAR --week WEEK \
  --ai-file .artifacts/reports/ai-daily-YEAR-MM-DD.json \
  --skip-telegram
```

### 5. Vérifier
- `AI content loaded`
- `stored in Convex ✓`

## SUCCESS CRITERIA
- Rapport quotidien avec analyse IA stocké dans Convex
- Visible sur /dashboard/reports
