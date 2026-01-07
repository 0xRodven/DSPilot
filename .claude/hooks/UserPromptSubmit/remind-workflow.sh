#!/bin/bash
# =============================================================================
# UserPromptSubmit Hook: SYSTÈME COMPLET DSPilot
# =============================================================================
# Ce hook s'exécute AVANT chaque message utilisateur.
# Il injecte le contexte complet: workflow, skills, patterns.
# =============================================================================

cat << 'DSPILOT_SYSTEM'
================================================================================
                        SYSTÈME DSPilot - RÈGLES OBLIGATOIRES
================================================================================

## WORKFLOW OBLIGATOIRE

**AVANT de coder, TU DOIS utiliser une commande:**
- `/apex` → Feature moyenne/complexe (plan + implémentation)
- `/one-shot` → Bug simple, tâche rapide, refactoring mineur
- `/test-smoke` → Test rapide santé app
- `/test-full` → Test complet 85 items

**JAMAIS coder directement sans utiliser une commande.**

--------------------------------------------------------------------------------

## SKILLS DISPONIBLES (Charger selon contexte)

### DSPilot Core
| Skill | Utiliser pour |
|-------|---------------|
| convex-enterprise | Mutations, queries, schema, multi-tenant |
| amazon-parser | Import HTML, parsing CSV, extraction données |
| tier-calculator | Classification DWC (Fantastic/Great/Fair/Poor) |
| coaching-workflow | Actions coaching, pipeline escalation |
| data-import | Lifecycle imports, validation CSV |
| kpi-alerts | Alertes performance, seuils critiques |
| weekly-recap | Génération PDF, rapports hebdo |

### UI/Frontend
| Skill | Utiliser pour |
|-------|---------------|
| next-components | React 19, App Router, Server Components |
| tailwind-expert | Styling, responsive, dark mode |
| figma-to-code | Conversion design → code |

### Business
| Skill | Utiliser pour |
|-------|---------------|
| stripe-billing | Paiements, subscriptions, webhooks |
| clerk-auth-expert | Auth multi-tenant, RBAC |

--------------------------------------------------------------------------------

## PATTERN BORIS CHERNY (Features Complexes)

1. **Plan** - Analyser, lister fichiers, estimer risques
2. **Execute** - Implémenter étape par étape
3. **Verify** - `npx tsc --noEmit` + `npm run build`

--------------------------------------------------------------------------------

## PATTERN RALPH WIGGUM (Exécution Autonome)

Travailler de façon autonome jusqu'à complétion:

1. Exécuter sans poser de questions inutiles
2. Utiliser TodoWrite pour tracker le progrès
3. Vérifier après chaque étape
4. Signal de fin: `TASK_COMPLETE: [description]`
5. Si bloqué: `TASK_BLOCKED: [raison spécifique]`

--------------------------------------------------------------------------------

## THRESHOLDS DWC (tier-calculator)

| Tier | DWC % | Couleur |
|------|-------|---------|
| Fantastic | >= 95% | emerald-400 |
| Great | >= 90% | blue-400 |
| Fair | >= 88% | amber-400 |
| Poor | < 88% | red-400 |

--------------------------------------------------------------------------------

## RÈGLES TECHNIQUES

- Convex pour data, PAS useState
- shadcn/ui + Tailwind UNIQUEMENT
- Pas de `any` - TypeScript strict
- Pattern `"skip"` pour queries conditionnelles
- organizationId sur TOUTES les tables

================================================================================
DSPILOT_SYSTEM

exit 0
