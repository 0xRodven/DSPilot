# Task 13: Monitoring et Analytics

## Phase
Phase 4 - Déploiement

## Priorité
MOYENNE

## Objectif
Ajouter le monitoring de performance et l'error tracking

## Composants

### 1. Vercel Analytics

Déjà installé (`@vercel/analytics`). Vérifier le setup:

```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

Métriques disponibles:
- Page views
- Unique visitors
- Web Vitals (LCP, FID, CLS)
- Top pages
- Referrers

### 2. Vercel Speed Insights (optionnel)

```bash
npm install @vercel/speed-insights
```

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next"

// Dans layout.tsx
<SpeedInsights />
```

### 3. Error Tracking (Sentry)

```bash
npx @sentry/wizard@latest -i nextjs
```

Configuration:
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})
```

### 4. Custom Events (Analytics)

```typescript
import { track } from "@vercel/analytics"

// Tracker les actions importantes
track("import_completed", {
  drivers: driversCount,
  station: stationCode,
})

track("coaching_action_created", {
  type: actionType,
  station: stationCode,
})
```

## Dashboard Monitoring

### Vercel Dashboard
- Deployments
- Analytics
- Logs
- Usage

### Convex Dashboard
- Queries/Mutations stats
- Function logs
- Database usage

### Sentry Dashboard
- Errors
- Performance
- Session replays

## Alertes

### Configurer dans Sentry:
- Alerte sur nouvelles erreurs
- Alerte si error rate > seuil
- Slack/Email integration

### Configurer dans Vercel:
- Deployment failed alerts
- Usage threshold alerts

## Steps

1. Vérifier que Vercel Analytics fonctionne
2. (Optionnel) Ajouter Speed Insights
3. (Optionnel) Configurer Sentry
4. Ajouter custom events pour actions clés
5. Configurer alertes

## Acceptance Criteria

- [ ] Analytics actif sur Vercel
- [ ] Web Vitals visibles
- [ ] (Optionnel) Error tracking avec Sentry
- [ ] (Optionnel) Alertes configurées
- [ ] Custom events sur actions clés
