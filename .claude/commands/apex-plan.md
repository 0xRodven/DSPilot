# Apex Plan - Phase de Planification

Deuxième phase: créer un plan d'implémentation détaillé.

## Prérequis

Avoir fait `/apex-analyze` au préalable.

## Processus

### 1. Lire l'Analyse

- Reprendre le document d'analyse dans `/spec/tasks/`
- Valider la compréhension

### 2. Décomposer en Tâches

- Créer des tâches atomiques
- Ordonner par dépendance
- Grouper par composant/module

### 3. Détailler Chaque Tâche

Format dans le fichier de tâches:

```markdown
### Tâche X: [Titre]
- **Fichier(s)**: /path/to/file.ts
- **Type**: [Création/Modification/Suppression]
- **Description**: [Ce qui doit être fait]
- **Dépendances**: [Tâches prérequises]
- **Tests**: [Comment vérifier]
```

### 4. Définir les Points de Contrôle

- Après chaque groupe de tâches
- Vérifications TypeScript/Lint
- Tests manuels

## Feature à Planifier

$ARGUMENTS

## Output

Mettre à jour le fichier: `/spec/tasks/[feature-name].md`
