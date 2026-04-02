---
name: dspilot-ops
description: Operational guide for working on DSPilot — deployments, build verification, dev vs prod Convex, Vercel env vars. Load this skill whenever starting work on DSPilot.
allowed-tools: Read, Write, Edit, Bash
---

# DSPilot Operations Reference

## Two Convex Deployments

- **DEV**: `pastel-snail-181` — used by `npm run dev` and `.env.local`
- **PROD**: `sincere-rhinoceros-718` — used by Vercel/dspilot.fr
- Data is **INDEPENDENT** between dev and prod
- Deploy key prefix determines target: `dev:pastel-snail-181|...` or `prod:sincere-rhinoceros-718|...`

## Commands

- `npm run dev` — Next.js + Convex dev on port 3005
- `npm run build` — production build (must pass before deploy)
- `npx tsc --noEmit` — type check
- `npm run lint` — Biome (104 pre-existing errors, non-blocking for dev)
- Convex dev deploy: `CONVEX_DEPLOY_KEY="dev:..." npx convex deploy --cmd 'echo skip' --yes`
- Convex prod deploy: `CONVEX_DEPLOY_KEY="prod:..." npx convex deploy --cmd 'echo skip' --yes`

## Pre-commit Hook

- Biome check runs on staged files, blocks due to 104 pre-existing errors
- Use `--no-verify` when committing if biome blocks on pre-existing issues

## Vercel

- Env vars are encrypted v2 (can't read via API, only write)
- Redeploy required after env var change
- Vercel redeploy does NOT redeploy Convex functions (separate step)
- Domain: dspilot.fr

## Station Prod

- Code: `FR-PSUA-DIF1`, org: `org_37Yb7MlFJHFs5h7K28zFYoZ4fUY`
- Station ownerId: `system-automation` (not a real Clerk user)
- Auth: `CLERK_JWT_ISSUER_DOMAIN=https://clerk.dspilot.fr`

## Verification Checklist (before declaring done)

1. `npx tsc --noEmit` — 0 errors
2. `npm run build` — all routes compile
3. No `any` types introduced
4. No hardcoded values (use Convex)
5. Tier thresholds: 95/90/88 (DWC), 70/60/50 (IADC)

## DO NOT

- Deploy to prod without build verification
- Modify `convex/_generated/` (auto-generated)
- Forget the deploy key when running `npx convex deploy` (headless fails)
- Confuse dev vs prod data — they are completely independent
- Use `useState` for server data (use Convex queries)
