## Résumé

<!-- 1-3 bullets : ce que ça fait, pourquoi -->

## Changements

<!-- Liste des fichiers/modules touchés et pourquoi -->

## Tests

- [ ] `npx tsc --noEmit` passe
- [ ] `npm run check` passe (biome)
- [ ] `npm run build` passe localement ou sur VPS Linux
- [ ] Testé manuellement sur `localhost:3005`
- [ ] Pas de régression sur les pages non-touchées

## Convex / migration

- [ ] Pas de changement de schema, OU
- [ ] Schema changé : `npx convex deploy` testé en dev avant prod
- [ ] Queries/mutations nouvelles protégées par `canAccessStation` / `requireOwner`

## Screenshots

<!-- Avant/après pour les changements UI -->

## Rollback

<!-- Comment revenir en arrière si ça casse en prod ? -->
