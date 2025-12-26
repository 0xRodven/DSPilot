# Apex Analyze - Phase d'Analyse

Première phase pour les features complexes. **NE PAS IMPLÉMENTER.**

## Objectif

Produire un document d'analyse détaillé pour guider l'implémentation.

## Processus

### 1. Comprendre la Feature

- Lire la demande et les specs
- Identifier les user stories
- Définir les critères d'acceptation

### 2. Analyser le Code Existant

- Trouver les patterns similaires
- Identifier les fichiers à modifier
- Repérer les dépendances

### 3. Évaluer la Complexité

- Lister les composants nécessaires
- Estimer le nombre de fichiers
- Identifier les risques techniques

### 4. Produire le Document

Créer un fichier dans `/spec/tasks/` avec ce format:

```markdown
## Analyse: [Nom Feature]

### Résumé
[1-2 phrases]

### User Stories
- En tant que [rôle], je veux [action] pour [bénéfice]

### Fichiers Impactés
- /path/to/file.ts - [raison]

### Dépendances
- [liste des dépendances]

### Risques
- [risques identifiés]

### Estimation
- Complexité: [Faible/Moyenne/Élevée]
- Fichiers: ~X
```

## Feature à Analyser

$ARGUMENTS
