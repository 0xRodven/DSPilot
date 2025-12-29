# Test Runner - Claude Chrome Extension

Orchestrateur principal pour les tests DSPilot.

## Usage

```
/test [type] [cible]
```

**Types disponibles:**
- `smoke` - Tests de santé rapides (~30s)
- `page` - Tests d'une page spécifique
- `flow` - Parcours utilisateur complet
- `visual` - Capture screenshots pour régression visuelle

**Cibles pour `page`:**
dashboard, drivers, driver-detail, import, coaching, errors, settings

**Cibles pour `flow`:**
weekly-review, coach-driver, import-verify

## Arguments

$ARGUMENTS

## Prérequis

1. `npm run dev` actif sur **localhost:3005**
2. Session Chrome authentifiée (Clerk)
3. Données de test présentes dans Convex

## Process

1. Vérifier que l'application tourne
2. Charger le cas de test depuis `tests/cases/{type}/{cible}.md`
3. Exécuter les étapes avec Claude Chrome
4. Prendre des screenshots aux checkpoints
5. Générer rapport Markdown dans `tests/reports/`

## Instructions

Quand l'utilisateur lance `/test`:

1. **Si aucun argument**: Afficher ce menu d'aide
2. **Si `smoke`**: Exécuter `/test-smoke`
3. **Si `page [nom]`**: Exécuter `/test-page [nom]`
4. **Si `flow [nom]`**: Exécuter `/test-flow [nom]`
5. **Si `visual [nom]`**: Exécuter `/test-visual [nom]`

## Contexte

Lire: `CLAUDE.md` (section Testing), `tests/helpers/README.md`

## Exemples

```bash
/test smoke                    # Smoke test rapide
/test page dashboard           # Tester le dashboard
/test flow weekly-review       # Parcours manager hebdo
/test visual coaching          # Screenshots page coaching
```
