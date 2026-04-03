# Daily Report - Rapport Quotidien

Génère le rapport quotidien de performance avec analyse IA.

## Process

### 1. Déterminer la date

Par défaut : hier. Sinon utiliser la date fournie.

### 2. Query les données Convex

```bash
source .env.secrets
export NEXT_PUBLIC_CONVEX_URL CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY_DEV"
```

### 3. Générer l'analyse IA

Query les données brutes d'abord :
```bash
npx tsx scripts/generate-daily-report.ts --station-code FR-PSUA-DIF1 --date DATE 2>&1
```
Lire la sortie pour le nombre de drivers et DWC moyen.

Puis query Convex pour les détails :
```bash
CONVEX_DEPLOYMENT="dev:pastel-snail-181" npx convex run reporting:getDailyReportData '{"stationCode":"FR-PSUA-DIF1","date":"DATE"}'
```

TU ES CLAUDE. Analyse les données et écris `.artifacts/reports/ai-daily-DATE.json` :
```json
{
  "aiSummary": "<p><strong>Point du jour.</strong></p><p>1-2 paragraphes. Urgences, tendance vs veille.</p>"
}
```

Règles :
- 1-2 paragraphes courts
- Focus urgences : livreurs en chute, alertes
- Citer les chiffres exacts

### 4. Regénérer avec l'analyse IA

```bash
npx tsx scripts/generate-daily-report.ts --station-code FR-PSUA-DIF1 --date DATE --ai-file .artifacts/reports/ai-daily-DATE.json
```

Vérifier : "AI content loaded" et "stored in Convex ✓".

### 5. Afficher le résumé

Afficher en Markdown : KPIs, alertes, absents, top/bottom 5.
