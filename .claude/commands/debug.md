# Debug Mode

Processus systématique de résolution de bugs.

## Processus

### 1. Reproduction

- Comprendre le symptôme
- Identifier les étapes de reproduction
- Localiser le fichier/fonction concerné

### 2. Diagnostic

- Analyser le code source
- Vérifier les logs (console, Convex)
- Tracer le flux de données

### 3. Hypothèses

- Lister les causes possibles
- Prioriser par probabilité
- Tester chaque hypothèse

### 4. Correction

- Implémenter le fix minimal
- Vérifier les effets de bord

### 5. Prévention

- Documenter la cause racine

## Bug à Résoudre

$ARGUMENTS

## Fichiers Fréquemment Problématiques

- `/convex/stats.ts` - Queries complexes
- `/src/lib/parser/` - Parsing HTML Amazon
- `/src/lib/store.ts` - State Zustand
- `/src/components/dashboard/header.tsx` - Hooks conditionnels
