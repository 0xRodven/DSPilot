# Analyse: Récapitulatifs Hebdomadaires WhatsApp

## Résumé

Envoi automatique de récapitulatifs de performance hebdomadaires aux conducteurs via WhatsApp (Twilio API). Le numéro de téléphone est optionnel, le timing configurable par station, et le contenu inclut stats, erreurs, coaching et conseils personnalisés.

## User Stories

- En tant que **manager**, je veux pouvoir ajouter le numéro de téléphone d'un conducteur pour lui envoyer des notifications WhatsApp
- En tant que **manager**, je veux configurer le jour et l'heure d'envoi des récaps pour ma station
- En tant que **conducteur**, je veux recevoir un récapitulatif hebdomadaire de mes performances sur WhatsApp
- En tant que **manager**, je veux voir l'historique des messages envoyés à chaque conducteur

## Fichiers Impactés

### Fichiers à Modifier

| Fichier | Raison |
|---------|--------|
| `convex/schema.ts` | Ajouter phoneNumber aux drivers, créer tables whatsappSettings et whatsappMessages |
| `convex/drivers.ts` | Ajouter mutations updateDriverPhone, toggleWhatsappOptIn |
| `src/components/drivers/driver-header.tsx` | Afficher/éditer téléphone, implémenter "Envoyer rapport" |
| `src/app/(main)/dashboard/settings/page.tsx` | Ajouter onglet WhatsApp |

### Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `convex/whatsapp.ts` | Toutes les fonctions WhatsApp (queries, mutations, actions) |
| `convex/crons.ts` | Scheduled functions pour envois automatiques |
| `src/components/drivers/phone-edit-modal.tsx` | Modal édition numéro téléphone avec validation E.164 |
| `src/components/settings/whatsapp-settings.tsx` | Configuration WhatsApp par station |
| `src/components/drivers/message-history.tsx` | Historique des messages envoyés |

## Dépendances

### Externes
- **Twilio SDK** (`twilio`) - API WhatsApp
- Variables d'environnement: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`

### Internes
- `getDriverWithFullHistory` - stats driver pour le contenu du récap
- `getDriverCoachingHistory` - actions coaching en cours
- Pattern de settings existant (`station-settings.tsx`)
- Pattern de modals existant (`new-action-modal.tsx`)

## Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rate limiting Twilio | Échec envois en masse | Queue avec délais (1 msg/sec max) |
| Numéros invalides | Messages non délivrés | Validation E.164 stricte côté serveur |
| RGPD non-conformité | Risque légal | Opt-in explicite obligatoire |
| Coûts Twilio élevés | Budget dépassé | Monitoring + alertes |
| Timezone mal gérée | Envois à mauvaise heure | Utiliser date-fns-tz |

## Estimation

- **Complexité**: Élevée (intégration externe + scheduled tasks + UI multiple)
- **Fichiers nouveaux**: ~5
- **Fichiers modifiés**: ~4
- **Effort estimé**: ~12h

## Critères d'Acceptation

- [ ] Le manager peut ajouter/modifier le numéro de téléphone d'un conducteur
- [ ] Le numéro est validé au format E.164 (+33612345678)
- [ ] Le conducteur peut opt-in/opt-out des notifications WhatsApp
- [ ] Le manager peut activer/désactiver WhatsApp pour sa station
- [ ] Le manager peut configurer le jour et l'heure d'envoi
- [ ] Les récaps sont envoyés automatiquement à l'heure configurée
- [ ] Le récap contient: stats, erreurs top 3, coaching en cours, conseil
- [ ] L'historique des messages est visible sur la page driver
- [ ] Le bouton "Envoyer rapport" envoie un récap immédiat
- [ ] Les échecs d'envoi sont loggés et visibles

## Notes Techniques

### Format du numéro de téléphone
```
Format E.164: +[code pays][numéro]
Exemple France: +33612345678
Regex validation: /^\+[1-9]\d{1,14}$/
```

### Template Message WhatsApp
```
📊 *Récap Semaine {week}*

Bonjour {name},

📈 *Performance*
DWC: {dwc}% {tier} {trend}
IADC: {iadc}%
Livraisons: {deliveries}

❌ *Top 3 erreurs*
1. {error1}
2. {error2}
3. {error3}

📋 *Coaching*
{status}

💡 {conseil}
```

### Scheduled Function Pattern (Convex)
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Vérifie toutes les heures s'il y a des envois à faire
crons.hourly(
  "check-whatsapp-sends",
  { minuteUTC: 0 },
  internal.whatsapp.checkAndSendRecaps
)

export default crons
```
