# DSPilot Claude Code Cheat Sheet

Quick reference for all Claude Code automation capabilities.

---

## Quick Start

```bash
# Lancer Claude Code
claude

# Avec Chrome pour tests
claude --chrome

# Mode autonome (pas de questions)
/one-shot <tâche>

# Mode structuré (plan + implémentation)
/apex <feature>
```

---

## Skills Disponibles

### Technical (DSPilot Core)

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `amazon-parser` | Parse HTML Amazon reports | Import DWC/IADC |
| `tier-calculator` | Calcul tiers et couleurs | Classification drivers |
| `coaching-workflow` | Pipeline escalation | Actions coaching |
| `weekly-recap` | Génération rapports | WhatsApp + PDF |
| `whatsapp-integration` | Twilio API patterns | Messagerie drivers |
| `kpi-alerts` | Système alertes | Notifications |
| `data-import` | Lifecycle imports | Traitement données |

### Stack (Technologies)

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `convex-enterprise` | Patterns Convex avancés | Mutations/queries |
| `next-components` | React 19 + App Router | Pages et composants |
| `nextjs-expert` | Next.js 16 deep dive | Routing, SSR, caching |
| `clerk-auth-expert` | Multi-tenant auth | Organisations, roles |
| `tailwind-expert` | Tailwind CSS v4 | Styling, responsive |
| `stripe-billing` | Stripe subscriptions | Paiements |

### Marketing & Growth

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `landing-page-copywriter` | Copy conversion | Pages de vente |
| `seo-optimizer` | SEO technique | Meta, structure |
| `content-repurposer` | Adaptation contenu | Multi-plateforme |
| `email-sequences` | Séquences email | Onboarding, nurture |

### Design & UI

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `figma-to-code` | Design → Code | Mockups → React |
| `tailwind-expert` | CSS avancé | Layouts, animations |

### Sales & Acquisition

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `sales-copywriter` | Copy de vente | Pricing, promos |
| `cold-outreach` | Emails prospection | Séquences cold |

### Strategy & Business

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `competitor-analysis` | Analyse concurrence | Matrices, SWOT |
| `product-positioning` | Positionnement | April Dunford |
| `market-research` | Études marché | TAM/SAM/SOM |
| `ux-researcher` | Recherche UX | Interviews, personas |

### Bonus

| Skill | Description | Quand utiliser |
|-------|-------------|----------------|
| `social-media-generator` | Posts sociaux | Twitter, LinkedIn |
| `documentation-writer` | Docs techniques | API, guides |

---

## Commandes Slash

### DSPilot Core

```bash
# Vérifier un import
/import-verify

# Analyser et coacher un driver
/coach <driver-id>

# Générer rapport hebdo
/weekly-report

# Déployer en production
/deploy
```

### Development

```bash
# Tâche simple autonome
/one-shot <description>

# Feature structurée
/apex <feature>

# Tests Chrome Extension
/test-smoke
/test-page dashboard
/test-flow weekly-review
/test-full
```

---

## Agents

| Agent | Rôle | Modèle |
|-------|------|--------|
| `feature-builder` | Nouvelles features (Boris workflow) | opus |
| `bug-fixer` | Debugging systématique | opus |
| `test-runner` | Tests Chrome Extension | opus |
| `data-validator` | Validation schéma/données | opus |
| `ui-polisher` | Tailwind/shadcn polish | opus |

---

## Workflows

### Boris Cherny (Features)

```
1. Plan Mode (Shift+Tab x2)
   → Explorer codebase
   → Créer plan détaillé
   → Obtenir approbation

2. Auto-Accept Mode (Shift+Tab x1)
   → Implémenter le plan
   → Edits auto-acceptés
   → Circuit breakers actifs

3. Vérification
   → npm run lint
   → npx tsc --noEmit
   → npm run build
```

### Ralph Wiggum (Boucles Autonomes)

```bash
# Lancer une boucle autonome
while :; do cat .claude/prompts/PROMPT-feature.md | claude ; done

# Circuit breakers dans le prompt:
# - Max iterations: 50
# - Token: TASK_COMPLETE pour terminer
# - Max cost: limiter le budget
```

### Quick Fix

```bash
# Bug simple
/one-shot "Fix: [description du bug]"

# C'est tout. Pas de questions, exécution directe.
```

---

## Hooks (Auto-Vérification)

| Hook | Déclencheur | Action |
|------|-------------|--------|
| `format-and-lint.sh` | Après Edit/Write | Auto-format + ESLint |
| `block-dangerous.sh` | Avant tool | Bloque fichiers sensibles |
| `verify-build.sh` | Avant Stop | Type check + lint |

### Fichiers Protégés

- `convex/_generated/` - Auto-généré
- `node_modules/` - Dépendances
- `.env*` - Secrets
- Force push main - Dangereux

---

## Patterns de Code

### Query Pattern

```tsx
const station = useQuery(api.stations.get, { code })
const data = useQuery(
  api.stats.getData,
  station ? { stationId: station._id } : "skip"
)

if (!station || data === undefined) {
  return <Skeleton />
}
```

### Mutation Pattern

```tsx
const create = useMutation(api.coaching.createAction)

const handleCreate = async (data) => {
  try {
    await create(data)
    toast.success("Créé")
  } catch (error) {
    toast.error("Erreur")
  }
}
```

### Tier Colors

```tsx
import { getTier, getTierColor } from "@/lib/utils/tier"

const tier = getTier(dwcPercent)
// "fantastic" (≥98.5%), "great" (≥96%), "fair" (≥90%), "poor" (<90%)

const color = getTierColor(tier)
// "text-emerald-400", "text-blue-400", "text-amber-400", "text-red-400"
```

---

## Raccourcis Clavier

| Action | Raccourci |
|--------|-----------|
| Annuler opération | `Escape` |
| Plan Mode | `Shift+Tab` x2 |
| Auto-Accept Mode | `Shift+Tab` x1 |
| Compacter contexte | `/compact` |
| Aide | `/help` |

---

## Commandes Bash Fréquentes

```bash
# Développement
npm run dev              # Next.js + Convex
npm run build            # Build production
npm run lint             # ESLint

# Convex
npx convex dev           # Dev server
npx convex deploy        # Production

# Git
git status
git add .
git commit -m "message"
git push

# Tests
claude --chrome          # Tests navigateur
```

---

## Troubleshooting

### "Context too long"

```bash
/compact
```

### "Build failed"

```bash
npx tsc --noEmit         # Voir erreurs types
npm run lint             # Voir erreurs lint
```

### "Convex error"

```bash
# Vérifier schema
npx convex dev           # Voir logs
# Vérifier indexes dans schema.ts
```

### "Import failed"

1. Vérifier format HTML Amazon
2. Vérifier que le parser supporte ce type
3. Voir `src/lib/parser/index.ts`

---

## Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `CLAUDE.md` | Instructions projet |
| `convex/schema.ts` | Schéma base de données |
| `src/lib/store.ts` | State Zustand |
| `src/lib/types.ts` | Types TypeScript |
| `src/lib/utils/tier.ts` | Calculs tiers |
| `src/lib/parser/index.ts` | Parser Amazon |

---

## Structure Projet

```
DSPilot/
├── .claude/
│   ├── skills/          # 23 skills
│   ├── commands/        # 16 commandes
│   ├── agents/          # 5 agents
│   ├── hooks/           # 3 hooks
│   └── prompts/         # 4 templates
├── convex/              # Backend Convex
├── src/
│   ├── app/             # Pages Next.js
│   ├── components/      # Composants React
│   └── lib/             # Utilitaires
├── spec/                # Documentation
├── tests/               # Tests Chrome
├── CLAUDE.md            # Instructions
└── CHEATSHEET.md        # Ce fichier
```

---

## Tips Pro

1. **Toujours lire avant d'éditer**
   - Claude doit lire un fichier avant de le modifier

2. **Skip pour queries conditionnelles**
   ```tsx
   useQuery(api.x, condition ? args : "skip")
   ```

3. **Parallel tool calls**
   - Claude peut appeler plusieurs outils en parallèle
   - Maximiser pour performance

4. **Skills = Progressive Disclosure**
   - Ne charger que les skills pertinents
   - ~100 tokens par skill metadata

5. **Boris pour features, One-Shot pour fixes**
   - Gros travail = Plan Mode + Auto-Accept
   - Petit travail = `/one-shot`

---

## Support

- **Documentation**: `spec/PRD.md`, `spec/ARCHITECTURE.md`
- **Issues**: Décrire le bug précisément
- **Features**: Utiliser `/apex` avec description claire

---

*Généré avec Claude Code pour DSPilot*
