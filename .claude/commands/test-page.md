# Test Page

Test complet d'une page spécifique de DSPilot.

## Usage

```
/test-page [page-name]
```

**Pages disponibles:**
- `dashboard` - Dashboard principal avec KPIs
- `drivers` - Liste des drivers avec filtres
- `driver-detail` - Détail d'un driver individuel
- `import` - Import de fichiers CSV/HTML
- `coaching` - Kanban des actions de coaching
- `errors` - Analyse des erreurs DWC/IADC
- `settings` - Paramètres station/compte

## Arguments

$ARGUMENTS

## Prérequis

- `npm run dev` actif sur localhost:3005
- Utilisateur authentifié
- Données de test présentes

## Instructions

1. **Charger le cas de test**
   - Lire `tests/cases/pages/{page-name}.md`
   - Comprendre les tests à exécuter

2. **Naviguer vers la page**
   - Aller à l'URL correspondante
   - Attendre chargement complet (disparition skeleton)

3. **Exécuter les tests**
   - Suivre chaque test défini dans le fichier
   - Vérifier les assertions
   - Noter les résultats

4. **Tester les interactions**
   - Cliquer sur les éléments interactifs
   - Vérifier les réponses UI
   - Tester les filtres/tri si applicable

5. **Screenshots**
   - Avant: État initial de la page
   - Après: Après interactions principales

6. **Générer rapport**
   - Sauvegarder dans `tests/reports/page-{name}-{date}.md`

## Mapping URL

| Page | URL |
|------|-----|
| dashboard | /dashboard |
| drivers | /dashboard/drivers |
| driver-detail | /dashboard/drivers/[id] |
| import | /dashboard/import |
| coaching | /dashboard/coaching |
| errors | /dashboard/errors |
| settings | /dashboard/settings |

## Attente Convex

Après navigation, toujours attendre:
1. Disparition des éléments `.animate-pulse` (skeleton)
2. Apparition des données (tables, cards, charts)
3. Timeout max: 10 secondes

## Rapport Template

```markdown
# Test Page: {page-name} - {date}

## Résultat: PASS/FAIL

## Tests exécutés
| Test | Résultat | Notes |
|------|----------|-------|
| T1: ... | OK/FAIL | ... |
| T2: ... | OK/FAIL | ... |

## Interactions testées
- [ ] Interaction 1: OK/FAIL
- [ ] Interaction 2: OK/FAIL

## Screenshots
- [Initial](./screenshots/...)
- [Après interaction](./screenshots/...)

## Erreurs console
...
```

## Contexte

Lire: `tests/cases/pages/{page-name}.md`
