---
globs:
  - "convex/**"
---

# Règles Convex DSPilot

## Pourquoi Convex (ne pas remettre en question)
Real-time subscriptions + no cold starts + schéma typé + pas de DevOps.
Alternative rejetée : tRPC + Postgres (trop de DevOps, pas de real-time natif).

## Patterns obligatoires
- Validators `v.*` sur tous les args de query/mutation
- Indexes pour toutes les queries fréquentes (jamais de full scan)
- `"skip"` côté client si les args ne sont pas prêts
- Queries = lecture seule et mise en cache auto
- Mutations = modifications + optimistic updates possible

## Isolation multi-tenant
- Chaque query/mutation doit vérifier `stationId` (isolation par station)
- Jamais retourner des données cross-station
- Pattern : `ctx.db.query("table").withIndex("by_station", q => q.eq("stationId", args.stationId))`

## Gotchas vécus
- **Idempotence webhooks** : toujours utiliser une clé d'idempotence (ex: userId Clerk) dans les mutations créées depuis des webhooks — sinon double-création possible
- **Schema migrations** : tester en local (dev: pastel-snail-181) avant de déployer en prod (sincere-rhinoceros-718)
- **Deploy keys** : préfixes différents dev vs prod — vérifier avant `npx convex deploy`
