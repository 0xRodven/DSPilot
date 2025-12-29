# Smoke Test

Vérification rapide que DSPilot fonctionne correctement.

## Durée: ~30 secondes

## Prérequis

- `npm run dev` actif sur localhost:3005
- Chrome ouvert

## Instructions

Exécute les étapes suivantes avec Claude Chrome (`claude --chrome`):

### Étape 1: Charger l'application
- **Action**: Naviguer vers `http://localhost:3005`
- **Attendu**: Page charge sans écran blanc
- **Timeout**: 10 secondes
- **Si échec**: Vérifier que `npm run dev` tourne

### Étape 2: Vérifier console
- **Action**: Lire la console navigateur
- **Attendu**: Pas d'erreurs rouges (warnings acceptables)
- **Si erreurs**: Noter les messages pour le rapport

### Étape 3: Vérifier authentification
- **Action**: Chercher avatar utilisateur dans le header
- **Attendu**: Avatar ou initiales visibles
- **Si absent**: L'utilisateur doit se reconnecter via Clerk

### Étape 4: Naviguer au Dashboard
- **Action**: Aller vers `/dashboard` (clic sidebar ou URL directe)
- **Attendu**: Page dashboard charge

### Étape 5: Vérifier KPI Cards
- **Action**: Identifier les 4 KPI cards
- **Attendu**:
  - Card "DWC" avec pourcentage
  - Card "IADC" avec pourcentage
  - Card "Drivers" avec compte
  - Card "Alertes" avec compte
- **Si manquant**: Vérifier données importées

### Étape 6: Screenshot final
- **Action**: Capture pleine page
- **Sauvegarder**: `tests/reports/screenshots/smoke-{timestamp}.png`

## Critères de succès

- [ ] Pas d'erreurs console critiques
- [ ] Utilisateur authentifié visible
- [ ] 4 KPI cards affichées
- [ ] Pas de skeleton/loading persistant (>10s)

## Rapport

Générer `tests/reports/smoke-{date}.md`:

```markdown
# Smoke Test Report - {date}

## Résultat: PASS/FAIL

## Vérifications
- [ ] App charge: OK/FAIL
- [ ] Console propre: OK/FAIL (X warnings)
- [ ] Auth visible: OK/FAIL
- [ ] KPIs affichés: OK/FAIL

## Screenshot
![Smoke test](./screenshots/smoke-{timestamp}.png)

## Erreurs (si applicable)
...
```

## Contexte

Lire: `tests/cases/smoke/health-check.md`
