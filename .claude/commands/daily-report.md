# Daily Report - Rapport Quotidien

Génère le rapport quotidien de performance pour la station avec analyse IA.

## Process

### 1. Déterminer la semaine

```bash
YEAR=$(date +%Y)
WEEK=$(date +%V)
```

### 2. Query les données Convex

```bash
source .env.secrets
CONVEX_DEPLOYMENT="dev:pastel-snail-181" npx convex run reporting:getReportData '{"stationCode":"FR-PSUA-DIF1","year":YEAR,"week":WEEK}'
```

Extraire : kpis (avgDwc, avgIadc, activeDrivers, totalDelivered), dwcDistribution, drivers (name, dwcPercent, dwcTrend, totalDeliveries, daysWorked).

### 3. Générer l'analyse IA

TU ES CLAUDE. Analyse les données et écris `.artifacts/reports/ai-daily-YYYY-MM-DD.json` :

```json
{
  "aiSummary": "<p><strong>Point du jour.</strong></p><p>1-2 paragraphes courts. Urgences du jour.</p>",
  "aiRecommendations": "<ol><li><strong>Action urgente</strong> — ce que le manager doit faire AUJOURD'HUI.</li></ol>",
  "driverRecommendations": [
    {"name": "AMAZON_ID", "recommendation": "Action pour aujourd'hui.", "why": "Raison factuelle."}
  ]
}
```

Règles :
- aiSummary : 1-2 paragraphes courts. Focus urgences.
- aiRecommendations : 2-3 actions max. Actionnables AUJOURD'HUI.
- driverRecommendations : 3-5 livreurs max. Cas critiques (<85% ou chute >5pp) uniquement.
- Citer les chiffres exacts.

### 4. Générer le rapport HTML

```bash
source .env.secrets
export NEXT_PUBLIC_CONVEX_URL CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY_DEV"
npx tsx scripts/generate-report.ts --station-code FR-PSUA-DIF1 --year YEAR --week WEEK --ai-file .artifacts/reports/ai-daily-YYYY-MM-DD.json --skip-telegram
```

### 5. Vérifier

La sortie doit contenir "AI content loaded" et "stored in Convex ✓".

Afficher le résumé Markdown dans la console.
