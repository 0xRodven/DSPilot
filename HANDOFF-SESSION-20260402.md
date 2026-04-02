# DSPilot — Handoff Session 2026-04-02

> Copie-colle ce prompt pour reprendre exactement là où on s'est arrêté.

---

## Prompt à donner à Claude Code :

```
Tu reprends le projet DSPilot après une session marathon. Lis d'abord ces fichiers pour le contexte :

1. CLAUDE.md (règles du projet)
2. .claude/projects/-Users-ousmane-Desktop-DSPilot/memory/project_session_20260402c_handoff.md (handoff complet)
3. .claude/skills/anti-slop-landing/SKILL.md (skill anti-AI-slop)
4. .artifacts/landing-copy-validated.md (copy validé)
5. .artifacts/landing-prototype.html (prototype light mode)

## Ce qui a été fait (session 2026-04-02)

- Reports pipeline complet (weekly + daily templates, pipeline post-ingest, page /dashboard/reports)
- Claude Remote Agents actifs (weekly dim 22h, daily 7h quotidien)
- 5 bugs coaching fixés + Kanban DONE column
- Legal pages + SEO (about, privacy, terms, legal, robots.txt, sitemap)
- Landing page copy refonte (8 sections, pricing 499€/999€/sur devis)
- Skill anti-slop-landing créé + deps installées (lenis, gsap, spline)

## Ce qu'il faut faire MAINTENANT

### P0 : Landing Page Design Refonte
Le copy est intégré dans les composants React mais le DESIGN est toujours le template dark générique. Il faut :
1. Switcher en light mode (fond off-white chaud #FAFAF8)
2. Appliquer les fonts Instrument Serif (display) + Outfit (body) via next/font/google
3. Ajouter Lenis smooth scroll
4. Ajouter GSAP ScrollTrigger pour les scroll reveals
5. Backgrounds mesh gradient (pas solide)
6. Optionnel : Spline 3D pour le hero
7. Le prototype de référence est dans .artifacts/landing-prototype.html

Utiliser le skill anti-slop-landing. 8 techniques : clone inspiration, custom backgrounds, GSAP+Motion animations, typo distinctive, 3D Spline, itération screenshots.

ANTI-PATTERNS À ÉVITER :
- Dark mode par défaut
- Inter/Roboto/Arial
- Gradients violets
- Cards identiques (icon + titre + desc)
- Faux testimonials
- Buzzwords IA

### P1 : Driver Individual Report
Rien n'a été créé (agent timeout). À faire :
- src/lib/pdf/driver-report-template.ts (template HTML 1 page par livreur, même style que report-template.ts)
- convex/reporting.ts → ajouter query getDriverReportData
- scripts/generate-driver-reports.ts (batch : loop drivers, HTML, store Convex)

### P2 : Vérifier les agents
- https://claude.ai/code/scheduled
- trig_01EAVQFMazCbAa7Y8gBEhoTH (weekly dim 22h)
- trig_01TmkhfvdopSFVc7NnVgeY56 (daily 7h)

## Pricing validé
| Plan | Mensuel | Annuel |
|------|---------|--------|
| Starter | Gratuit | - |
| Pro | 499€ | 399€/mois |
| Business | 999€ | 799€/mois |
| Enterprise | Sur devis | - |

## Stack
Next.js 16 + React 19 + Convex + Clerk + Tailwind v4 + shadcn/ui + Framer Motion + GSAP + Lenis + Spline
```
