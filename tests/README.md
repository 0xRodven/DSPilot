# DSPilot Tests

Framework de testing basé sur Claude Code Chrome Extension.

## Philosophie

Ce projet utilise une approche de testing en **langage naturel** via l'extension Chrome de Claude Code, plutôt que des frameworks traditionnels comme Playwright ou Jest.

**Avantages:**
- Tests lisibles par tous (pas seulement les devs)
- Pas de sélecteurs CSS fragiles à maintenir
- Sessions authentifiées (Clerk) persistantes
- Accès direct à la console et au DOM
- Feedback loop immédiat

## Structure

```
tests/
├── cases/                    # Définitions des tests (Markdown)
│   ├── smoke/               # Tests de santé rapides
│   │   └── health-check.md
│   ├── pages/               # Tests par page
│   │   ├── dashboard.md
│   │   ├── drivers.md
│   │   ├── import.md
│   │   └── coaching.md
│   └── flows/               # Parcours utilisateur
│       └── manager-weekly-review.md
├── helpers/                  # Instructions réutilisables
│   └── README.md
├── reports/                  # Rapports générés
│   ├── screenshots/         # Captures d'écran
│   └── *.md                 # Rapports Markdown
└── README.md                # Ce fichier
```

## Prérequis

1. **Claude Code** installé et à jour
2. **Extension Claude for Chrome** installée
3. **Compte Claude** avec plan payant (Pro, Team, Enterprise)
4. **Chrome** (pas Brave, Arc, ou autres)

## Lancer les tests

### 1. Démarrer l'application

```bash
npm run dev
```

L'app doit tourner sur `http://localhost:3005`

### 2. Lancer Claude avec Chrome

```bash
claude --chrome
```

### 3. Utiliser les slash commands

| Commande | Description |
|----------|-------------|
| `/test-smoke` | Test de santé rapide (~30s) |
| `/test-page dashboard` | Tester le dashboard |
| `/test-page drivers` | Tester la page drivers |
| `/test-page coaching` | Tester le coaching |
| `/test-flow weekly-review` | Parcours manager hebdo |
| `/test-visual dashboard` | Captures screenshots |

## Types de tests

### Smoke Test (`/test-smoke`)

Vérification rapide que l'app fonctionne:
- App charge sans erreur
- Utilisateur authentifié
- Dashboard affiche les KPIs

**Durée:** ~30 secondes

### Page Tests (`/test-page [page]`)

Test complet d'une page spécifique:
- Affichage initial
- Interactions (clics, filtres, tri)
- Assertions sur le contenu

**Durée:** 3-5 minutes par page

### Flow Tests (`/test-flow [flow]`)

Parcours utilisateur multi-pages:
- Scénarios réalistes
- Navigation entre pages
- Vérifications à chaque étape

**Durée:** 2-5 minutes par flow

### Visual Tests (`/test-visual [page]`)

Captures d'écran pour régression visuelle:
- Desktop (1920x1080)
- Mobile (390x844)
- Comparaison avec captures précédentes

## Format des cas de test

Chaque fichier `.md` dans `cases/` suit ce format:

```markdown
# Test: {Nom}

## Prérequis
- Condition 1
- Condition 2

## Tests

### T1: Nom du test

**Étapes**:
1. Action 1
2. Action 2

**Assertions**:
- [ ] Check 1
- [ ] Check 2

## Rapport

Template du rapport à générer...
```

## Rapports

Les rapports sont générés dans `tests/reports/`:
- `smoke-{date}.md` - Résultats smoke test
- `page-{name}-{date}.md` - Résultats test page
- `flow-{name}-{date}.md` - Résultats test flow
- `screenshots/*.png` - Captures d'écran

## Best Practices

### Avant de tester

1. Vérifier `npm run dev` actif
2. S'assurer d'être authentifié dans Chrome
3. Avoir des données de test importées

### Pendant le test

1. Laisser Claude exécuter sans interférer
2. Si auth expirée: se reconnecter quand demandé
3. Pour les longs flows: surveiller le contexte

### Après le test

1. Vérifier le rapport généré
2. Examiner les screenshots
3. Investiguer les échecs

## Gestion du contexte

L'extension Chrome consomme beaucoup de contexte. Recommandations:

- Exécuter un test à la fois
- Faire `/compact` entre les tests si nécessaire
- Éviter les flows trop longs (>5 minutes)

## Troubleshooting

| Problème | Solution |
|----------|----------|
| "Extension not connected" | Relancer `claude --chrome` |
| Auth expirée | Se reconnecter via Clerk dans Chrome |
| Skeleton infini | Vérifier Convex (`npx convex dev`) |
| Données manquantes | Importer données via `/dashboard/import` |

## Ajouter un nouveau test

1. Créer fichier dans `tests/cases/{type}/`
2. Suivre le format Markdown existant
3. Documenter prérequis et assertions
4. Tester avec `/test-page [nom]` ou `/test-flow [nom]`

## Contribuer

Pour améliorer les tests:
1. Modifier les fichiers `.md` dans `tests/cases/`
2. Les slash commands sont dans `.claude/commands/`
3. Ajouter des cas de test pour nouvelles features
