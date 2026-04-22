# DSPilot — CLAUDE.md

<!-- Fichier relu à chaque message. Garder < 80 lignes. Détails dans .claude/rules/ -->

## Identité
SaaS de gestion de performance livreurs Amazon (DWC/IADC). Station DIF1, ~113 livreurs.
Stack : **Next.js 16 + React 19 + Convex + Clerk + Tailwind + shadcn/ui**. Port dev : 3005.

<!-- Pourquoi ce stack : Convex = real-time sans DevOps. Clerk = auth multi-tenant SAML. -->
<!-- Next.js App Router = Server Components natifs. Tailwind = pas de CSS à maintenir. -->

## Commandes
```bash
npm run dev          # Next.js + Convex dev
npm run build        # Build prod
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npx convex deploy    # Deploy prod (vérifier env avant : dev=pastel-snail-181, prod=sincere-rhinoceros-718)
```

## Workflow
- Feature → `/apex` | Bug rapide → `/one-shot` | Nouvelle tâche → `/spec`
- Ne jamais coder directement. Confiance < 95% → poser des questions.

## Fichiers clés
| Fichier | Rôle |
|---------|------|
| `convex/schema.ts` | Schema DB complet |
| `src/lib/store.ts` | State global Zustand |
| `src/lib/types.ts` | Types TS centralisés |
| `src/lib/utils/tier.ts` | Tiers DWC (utiliser getTier/getTierColor) |
| `src/lib/parser/index.ts` | Parser HTML Amazon |

## Règles critiques (détail dans .claude/rules/)
- `convex/_generated/` = jamais modifier
- Semaines Amazon = **dimanche→samedi** (pas ISO) — corrigé dans 14 fichiers, ne pas réintroduire
- Convex webhooks = toujours idempotency key
- Import multi-semaines = jamais >1 semaine d'un coup

## Références
- PRD : `spec/PRD.md` | Architecture : `spec/ARCHITECTURE.md`
- Skills : `.claude/skills/` | Agents : `.claude/agents/`
- Wiki contexte domain : `~/wiki/wiki/hot-DSPilot.md`
