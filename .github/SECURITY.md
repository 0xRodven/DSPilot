# Security Policy

## Reporting a Vulnerability

DSPilot gère des données RH sensibles (performance livreurs, coordonnées téléphone, notes coaching). Toute faille de sécurité doit être signalée **en privé**, jamais via une issue publique.

Contact : **ousmane@dspilot.fr**

Merci d'inclure :
- Description du problème + impact potentiel
- Étapes de reproduction
- Version / commit concerné
- Si possible, une idée de correctif

Nous nous engageons à répondre sous **48 h ouvrables** et à publier un correctif sous 7 jours pour toute faille critique (fuite cross-tenant, bypass auth, RCE).

## Périmètre

| Composant | Incluse |
|---|---|
| Application Next.js (`dspilot.fr`) | ✅ |
| Backend Convex prod | ✅ |
| Scraper VPS | ✅ |
| Clerk auth flow | ✅ (reporter à Clerk directement pour leur infrastructure) |
| Dépendances npm / pip | ✅ (nous patcherons rapidement les CVE connus) |

## Hors périmètre

- Vulnérabilités dans des services tiers (Vercel, Clerk, Convex infra, Anthropic API)
- Attaques nécessitant un accès physique à la machine utilisateur
- DoS via consommation de tokens / quota (nous avons un rate-limit côté Convex)

## Bonnes pratiques internes

- Multi-tenant isolation : toute query/mutation Convex appelle `canAccessStation` avant de retourner des données.
- Secrets : jamais dans le repo. Utiliser `.env.local` (gitignored) + Vercel env vars.
- Webhooks Clerk : signature svix vérifiée + clé d'idempotence systématique.
- Scripts VPS : tokens dans `/root/.secrets/dspilot.env` (chmod 600).
