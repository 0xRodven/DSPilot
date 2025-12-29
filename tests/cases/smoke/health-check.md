# Smoke Test: Health Check

Vérification rapide que DSPilot fonctionne.

## Prérequis

- `npm run dev` actif sur localhost:3005
- Chrome disponible

## Étapes

### 1. Charger l'application

- **Action**: Naviguer vers `http://localhost:3005`
- **Attendu**: Page charge sans écran blanc
- **Timeout**: 10 secondes
- **Si échec**: Vérifier `npm run dev` et les logs terminal

### 2. Vérifier console

- **Action**: Ouvrir console navigateur (DevTools)
- **Attendu**: Pas d'erreurs rouges
- **Note**: Warnings Convex/Next.js sont acceptables
- **Si erreurs**: Noter le message pour investigation

### 3. Vérifier authentification

- **Action**: Chercher avatar utilisateur en haut à droite du header
- **Attendu**: Avatar ou initiales visibles (ex: "OU")
- **Si absent**:
  - Session Clerk expirée
  - Demander à l'utilisateur de se reconnecter
  - Attendre confirmation avant de continuer

### 4. Naviguer au Dashboard

- **Action**: Cliquer sur "Dashboard" dans la sidebar OU aller à `/dashboard`
- **Attendu**: Page dashboard s'affiche
- **Timeout**: 5 secondes

### 5. Attendre chargement données

- **Action**: Observer les KPI cards
- **Attendu**:
  - Skeletons disparaissent
  - Valeurs numériques apparaissent
- **Timeout**: 10 secondes
- **Si timeout**: Vérifier connexion Convex

### 6. Vérifier KPI Cards

- **Action**: Identifier les 4 cards principales
- **Attendu**:
  - **DWC**: Pourcentage affiché (ex: "97.2%"), badge tier coloré
  - **IADC**: Pourcentage affiché, badge tier coloré
  - **Drivers**: Compte affiché (ex: "45/50")
  - **Alertes**: Nombre affiché (ex: "3")
- **Si manquant**: Données non importées ou erreur query

### 7. Screenshot final

- **Action**: Capture pleine page du dashboard
- **Sauvegarder**: `tests/reports/screenshots/smoke-{YYYYMMDD-HHmmss}.png`

## Critères de succès

- [ ] App charge sans écran blanc
- [ ] Pas d'erreurs console critiques (rouge)
- [ ] Avatar utilisateur visible (authentifié)
- [ ] 4 KPI cards affichées avec valeurs
- [ ] Pas de skeleton persistant (>10s)

## En cas d'échec

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Écran blanc | Serveur non démarré | Lancer `npm run dev` |
| Erreur console "Convex" | Backend non connecté | Vérifier `npx convex dev` |
| Pas d'avatar | Session expirée | Reconnecter via Clerk |
| KPIs vides | Pas de données | Importer des données test |
| Skeleton infini | Query bloquée | Vérifier network/Convex |

## Résultat attendu

```
SMOKE TEST: PASS
- App: OK
- Console: OK (2 warnings)
- Auth: OK
- KPIs: 4/4 visible
- Screenshot: smoke-20251228-143022.png
```
