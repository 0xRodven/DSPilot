# DSPilot — Prompt de Handoff Agent

> Copie-colle ce prompt pour briefer un nouvel agent sur le projet DSPilot.

---

## Prompt à donner à l'agent :

```
Tu reprends le projet DSPilot — un SaaS B2B pour managers de stations Amazon DSP en France.

## État actuel (2026-03-25)
- Site LIVE : https://www.dspilot.fr (Vercel)
- Stack : Next.js 16 + React 19 + Convex + Clerk + shadcn/ui + Tailwind
- Repo : /root/DSPilot/ (github.com/0xRodven/DSPilot, 53 commits, build OK)
- Database : Convex pastel-snail-181 (14 tables, agent + RAG déployés)
- Auth : Clerk live (clerk.dspilot.fr, organizations)
- Email : Google Workspace sur dspilot.fr (DNS complet : MX + SPF + DKIM + DMARC)
- Toutes les credentials sont dans /root/.secrets/dspilot.env (source ce fichier)

## Contexte métier
DSPilot aide les managers de stations Amazon DSP à suivre la performance de leurs livreurs.
Les métriques clés viennent d'Amazon Logistics (pas d'API, tout est dans leur dashboard web) :
- DWC (Delivery With Care) : score principal, seuil ≥ 95%
- DNR (Did Not Receive) : réclamations clients
- Photos mal prises/manquantes
- Tier station : Fantastique (3 mois consécutifs = Amazon propose nouveaux dépôts)

## Ce qui est déjà fait
Dashboard complet avec KPIs, table drivers, fiches détaillées, coaching Kanban,
import HTML/CSV, alertes, export PDF, analyse erreurs, stats livraison, settings,
landing page, mode démo, mobile responsive, dark mode, real-time.

## Mission prioritaire : Browser Automation
La killer feature = connecter un agent browser à Amazon Logistics pour automatiser :
1. Téléchargement quotidien du rapport "Associé de livraison" (DNR, stats daily)
2. Téléchargement hebdo du rapport DWC
3. Injection automatique dans Convex
4. Alertes quand un driver dérape
5. Rapport hebdo auto envoyé par mail
6. Messages WhatsApp aux drivers avec recap perso

Outils disponibles :
- Stealth Browser MCP : /root/.claude/stealth-browser-mcp (browser indétectable, bypass antibot)
- Playwright MCP : skill ClawHub dans le workspace
- Playwright Scraper : skill ClawHub dans le workspace

## Fichiers clés à lire
1. /root/.openclaw/workspace-dspilot/BOOT.md — protocole agent complet
2. /root/.secrets/dspilot.env — toutes les credentials
3. /root/DSPilot/CLAUDE.md — règles du repo (workflow /apex + /one-shot)
4. /root/DSPilot/convex/schema.ts — schéma base de données
5. /root/DSPilot/src/lib/parser/ — parser actuel des rapports Amazon

## Commandes
source /root/.secrets/dspilot.env  # charger credentials
cd /root/DSPilot && npm run dev     # dev local
npm run build                        # build
CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY" npx convex deploy --cmd 'echo skip'  # deploy backend
vercel deploy --prod --yes --token "$VERCEL_TOKEN"  # deploy frontend
git push origin main                 # push code

## Règles
- /apex pour features, /one-shot pour quick fixes (voir CLAUDE.md)
- Ousmane = décisions stratégiques uniquement, l'agent est autonome sur l'exécution
- Zero feature bloat — chaque feature doit faire gagner du temps au manager
- Ship > Plan
```
