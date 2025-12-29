# Test Flow

Parcours utilisateur complet multi-pages.

## Usage

```
/test-flow [flow-name]
```

**Flows disponibles:**
- `weekly-review` - Manager consulte performances hebdo
- `coach-driver` - Créer et évaluer une action de coaching
- `import-verify` - Importer données et vérifier résultat

## Arguments

$ARGUMENTS

## Prérequis

- `npm run dev` actif sur localhost:3005
- Utilisateur authentifié
- Pour certains flows: données existantes requises

## Instructions

1. **Charger le flow**
   - Lire `tests/cases/flows/{flow-name}.md`
   - Comprendre les phases et étapes

2. **Exécuter séquentiellement**
   - Suivre chaque phase dans l'ordre
   - Ne pas sauter d'étapes
   - Attendre chargement entre pages

3. **Screenshots aux checkpoints**
   - Capturer à chaque fin de phase
   - Nommer: `{flow}-phase{N}-{description}.png`

4. **Vérifier assertions**
   - À chaque étape, vérifier l'attendu
   - Noter tout écart

5. **Timing**
   - Noter le temps de chaque phase
   - Durée totale du flow

6. **Générer rapport détaillé**
   - Sauvegarder dans `tests/reports/flow-{name}-{date}.md`

## Durées estimées

| Flow | Durée |
|------|-------|
| weekly-review | 2-3 min |
| coach-driver | 3-4 min |
| import-verify | 2-3 min |

## Gestion des erreurs

Si une étape échoue:
1. Screenshot l'état actuel
2. Noter l'erreur console si présente
3. Tenter de récupérer si possible
4. Sinon, marquer le flow comme FAIL

## Rapport Template

```markdown
# Flow Test: {flow-name} - {date}

## Résultat: PASS/FAIL
## Durée totale: Xm Xs

## Phase 1: {nom}
| Étape | Résultat | Durée |
|-------|----------|-------|
| 1.1 ... | OK/FAIL | Xs |
| 1.2 ... | OK/FAIL | Xs |

Screenshot: [phase1](./screenshots/...)

## Phase 2: {nom}
...

## Résumé
- Phases complétées: X/Y
- Erreurs rencontrées: Z
- Temps total: Xm Xs

## Screenshots
- [Phase 1](./screenshots/...)
- [Phase 2](./screenshots/...)
- ...
```

## Contexte

Lire: `tests/cases/flows/{flow-name}.md`
