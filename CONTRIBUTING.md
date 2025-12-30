# Contributing to DSPilot

## Branching

- `main` - Production, toujours stable
- `feature/*` - Nouvelles fonctionnalités
- `fix/*` - Corrections de bugs

## Commits

Format: `type: description`

Types:
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `refactor:` - Refactoring sans changement fonctionnel
- `chore:` - Maintenance, deps, config
- `docs:` - Documentation

Exemples:
```
feat: add driver tier history chart
fix: correct DWC percentage calculation
refactor: extract tier utils to separate module
```

## Pull Requests

1. Créer une branche depuis `main`
2. Faire les changements
3. Vérifier avant de push:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
4. Ouvrir une PR avec description claire
5. Attendre review

## Code Style

Voir `CLAUDE.md` pour les règles détaillées.

Points clés:
- TypeScript strict, jamais de `any`
- Tailwind CSS uniquement (pas de CSS modules)
- Convex pour le data fetching (pas de useEffect)
- shadcn/ui pour les composants de base

## Structure des fichiers

```
/src/app/(main)/dashboard/[page]/
├── page.tsx           # Page principale
├── _components/       # Composants spécifiques à la page
└── [id]/page.tsx      # Pages dynamiques

/convex/
├── schema.ts          # Schema unique
├── [entity].ts        # Queries/Mutations par entité
```

## Tests

Tests manuels via Claude Chrome Extension:
```bash
claude --chrome
/test-smoke              # Test rapide
/test-page dashboard     # Tester une page
/test-flow weekly-review # Parcours utilisateur
```
