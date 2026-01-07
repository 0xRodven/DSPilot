# Deploy - Deploiement Production

Workflow de deploiement securise avec verifications.

## Usage

```
/deploy [--skip-tests] [--convex-only] [--vercel-only]
```

## Options

| Flag | Description |
|------|-------------|
| `--skip-tests` | Saute les checks pre-deploy (dangereux) |
| `--convex-only` | Deploy uniquement Convex backend |
| `--vercel-only` | Deploy uniquement Vercel frontend |

## Process

### 1. Pre-Deploy Checks

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Git status
git status

# Branch check
git branch --show-current
```

**Bloque si:**
- Erreurs TypeScript
- Erreurs ESLint
- Build echoue
- Changements non commites
- Pas sur branch main (warning)

### 2. Convex Deploy

```bash
npx convex deploy
```

**Verifications:**
- Schema migrations OK
- Functions deployed
- No breaking changes

### 3. Vercel Deploy

```bash
vercel deploy --prod
```

**Verifications:**
- Build success
- Deployment URL accessible
- No console errors

### 4. Post-Deploy

- Health check production
- Verify Convex connection
- Notify success

## Output

```
=== DEPLOIEMENT DSPILOT ===

Pre-Deploy Checks:
[OK] TypeScript - Aucune erreur
[OK] ESLint - Aucune erreur
[OK] Build - Success
[OK] Git - Propre
[WARN] Branch - feature/x (pas main)

Deploying Convex...
[OK] Schema synced
[OK] 19 functions deployed
[OK] Environment: production

Deploying Vercel...
[OK] Build successful
[OK] Deployed to: https://dspilot.vercel.app
[OK] Edge functions ready

Post-Deploy:
[OK] Health check passed
[OK] Convex connected
[OK] No console errors

=== DEPLOIEMENT TERMINE ===
Production URL: https://dspilot.vercel.app
Duration: Xm Xs
```

## Securite

- **JAMAIS** force push sur main
- **TOUJOURS** verifier les checks avant deploy
- **CONFIRMER** explicitement avant production
- **ROLLBACK** disponible via Vercel dashboard

## Commandes de Fallback

```bash
# Rollback Vercel
vercel rollback

# Rollback Convex (manual)
npx convex deploy --preview

# Check logs
npx convex logs
vercel logs
```

## Instruction

$ARGUMENTS

## Contexte

- Utiliser les commandes npm du projet
- Respecter les variables d'environnement
- Logger toutes les etapes
- Proposer rollback si echec
