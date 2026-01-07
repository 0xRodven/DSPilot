# Coach - Recommandations Coaching

Analyse la performance d'un driver et suggere des actions de coaching.

## Usage

```
/coach [driver-name-or-amazon-id]
```

## Process

### 1. Analyse Driver

- Recuperer stats DWC/IADC actuelles
- Calculer tendance (4 dernieres semaines)
- Identifier categories d'erreurs principales
- Verifier actions de coaching existantes

### 2. Evaluation Pipeline

- Determiner stage pipeline (1-5)
- Historique escalations
- Review actions en pending

### 3. Recommendation

- Suggerer type d'action suivante
- Fournir justification basee sur les donnees
- Proposer date de follow-up

## Output Format

```
=== ANALYSE COACHING ===

Driver: [Nom]
Amazon ID: [ID]
Station: [Code]

--- Performance Actuelle ---
DWC: XX.X% ([tier])
IADC: XX.X%
Rang: X/XX

--- Tendance (4 semaines) ---
[chart ou arrows]
S47: XX.X% -> S48: XX.X% -> S49: XX.X% -> S50: XX.X%
Evolution: +/-X.X%

--- Erreurs Principales ---
1. [categorie]: XX (XX%)
2. [categorie]: XX (XX%)
3. [categorie]: XX (XX%)

--- Pipeline Coaching ---
Stage: X/5
Derniere action: [type] le [date] - [status]
Actions totales: XX

--- RECOMMANDATION ---

Action: [discussion | warning | training | suspension]

Justification:
[explication basee sur les donnees]

Categorie cible: [categorie d'erreur a adresser]

Date follow-up suggeree: [date]

Notes pour action:
[suggestions de points a aborder]
```

## Skills Utilises

- `coaching-workflow` - Pipeline et actions
- `tier-calculator` - Classification performance

## Instruction

$ARGUMENTS

## Contexte

- Si driver non trouve, lister les drivers disponibles
- Prioriser les donnees recentes
- Suivre le pipeline d'escalation
- Ne pas creer d'action automatiquement (suggestion seulement)
