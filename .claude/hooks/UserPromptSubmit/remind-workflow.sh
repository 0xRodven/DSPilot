#!/bin/bash
# UserPromptSubmit Hook: Rappel des regles workflow AVANT chaque message
#
# Ce hook s'execute AVANT que Claude traite le message utilisateur.
# Il injecte un rappel des commandes et skills disponibles.
#
# Exit codes:
#   0 = Continue (affiche le message)
#   2 = Block (ne pas continuer)

cat << 'REMINDER'
---
RAPPEL WORKFLOW DSPilot:
- /apex -> Feature moyenne/complexe
- /one-shot -> Bug simple, tache rapide
- /test-smoke ou /test-full -> Tests
Skills: convex-enterprise, next-components, amazon-parser, tier-calculator
---
REMINDER

exit 0
