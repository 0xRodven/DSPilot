# Claude Skills Arsenal — DSPilot

> Catalogue curé des meilleurs skills, MCPs et librairies à activer sur Claude pour DSPilot (présentations, maps, charts, BI, PR).
> Recherche du 2026-04-25 — 4 agents Opus en parallèle, ~50 sources croisées.
> **Objectif** : élever Claude du "bon assistant code" au "analyste-designer-distributeur full-stack".

---

## TL;DR — Ce qu'il faut installer cette semaine

| Priorité | Skill | Coût | Install |
|---|---|---|---|
| 🔥 Now | **Anthropic PPTX skill** (built-in) | Inclus Max | Activé auto |
| 🔥 Now | **Gamma Connector** (Claude native) | Free/Pro | Claude settings → Gamma OAuth |
| 🔥 Now | **Marp CLI** | Free | `npm i -g @marp-team/marp-cli` |
| 🔥 Now | **Recharts + Tremor** (dashboard) | Free | `npm i recharts @tremor/react` |
| 🔥 Now | **Mapbox MCP + react-map-gl** (maps) | Free tier 100k calls/mo | Key + `npm i react-map-gl mapbox-gl` |
| 🔥 Now | **Adresse.data.gouv.fr** (FR geocoding) | 100% Free | HTTP, no auth |
| ⭐ Week 2 | **Vega-Lite + Puppeteer** (PDF reports) | Free | `npm i vega vega-lite puppeteer` |
| ⭐ Week 2 | **Metabase MCP** (self-serve BI) | Free OSS / $80/mo | Docker + MCP config |
| ⭐ Week 2 | **Lemlist MCP** (cold outreach) | $35/mo | Claude MCP → Lemlist key |
| 💡 Later | Beehiiv newsletter / Prezly PR / Muck Rack | $100-833/mo | Plus tard |

---

# 1. Présentations & Slides

## S-tier (must-have)

### Anthropic PPTX skill (built-in)
- **Quoi** : génère des `.pptx` natifs directement depuis Claude.ai / Code / API
- **Install** : déjà actif sur Max plan, rien à faire
- **Usage DSPilot** : pitch decks + driver reports exportés depuis query Convex — la voie la plus rapide vers du `.pptx` Microsoft natif

### Gamma Connector (Claude native)
- **Quoi** : AI presentation builder, connecteur natif Claude. Tu donnes un brief + data, Gamma design le deck en 10s.
- **Install** : Claude settings → add Gamma account (OAuth)
- **Coût** : Gamma Basic free / Pro payant
- **Usage DSPilot** : pour les pitch decks à envoyer aux prospects. Qualité McKinsey sans effort design
- **Pourquoi S** : design distinctif, pas d'effort CSS, native Claude

### Marp CLI
- **Quoi** : Markdown → HTML/PPTX/PDF pipeline. Tu écris en MD, Claude améliore, tu export.
- **Install** : `npm install -g @marp-team/marp-cli`
- **Usage DSPilot** : rapports internes + decks de prospection versionnés dans git. Export `.pptx` via `--pptx-editable` (LibreOffice backend).
- **Pourquoi S** : source controllable, portable, full control

## A-tier

- **PptxGenJS** (`npm i pptxgenjs`) — génération PPTX programmatique JS, data-heavy slides depuis Convex
- **Office PowerPoint MCP Server** (`python-pptx` wrapper, 32 outils) — si tu veux automatiser des rapports multi-slides avec brand kit
- **Reveal.js** — présentations HTML interactives pour démos screen-share

## B-tier (skip pour l'instant)

- Beautiful.ai API — alternative Gamma payante
- Slidev — overkill pour sales pitch
- Pandoc — conversion format basique, pas de design

## Stack recommandée DSPilot

1. **Gamma** pour les pitch decks prospects (design instantané)
2. **Marp** pour les rapports internes versionnés
3. **Anthropic PPTX skill** pour génération one-shot depuis data

---

# 2. Maps & Géospatial

## S-tier (must-have)

### Mapbox MCP Server
- **Quoi** : MCP officiel Mapbox — geocoding, POI, routing, matrix, optimization
- **Install** : `npm install -g @mapbox/mcp-server` + clé Mapbox
- **Coût** : free 100k geocoding calls/mois, puis $0.50/1k
- **Usage DSPilot** : geocode adresses FR, optimise routes DNR, distance matrix multi-stations

### Mapbox GL + react-map-gl
- **Install** : `npm install react-map-gl mapbox-gl`
- **Usage DSPilot** : composant Map interactif dans le dashboard — clusters DNR, polylines routes

### deck.gl
- **Install** : `npm install deck.gl @deck.gl/react`
- **Usage DSPilot** : heatmaps GPU-accelerated (DNR density par zone), 3D routes

### Adresse.data.gouv.fr (BAN API)
- **Quoi** : geocoding officiel gouvernement FR, 100% free
- **Install** : HTTP direct, pas d'auth
- **Usage DSPilot** : batch-geocode TOUTES les concessions DNR (préférer à Mapbox pour les adresses FR — meilleure précision + zéro coût)

## A-tier

- **folium** (Python) — cartes interactives pour PDF reports
- **OpenStreetMap MCP Server** — fallback gratuit si Mapbox cost trop élevé
- **MapLibre GL JS** — fork OSS de Mapbox (pre-v3), compatible react-map-gl
- **Kepler.gl** — 3D heatmap Uber pour multi-stations
- **leafmap** (Python) — wrapper unifié folium/pydeck/kepler

## B-tier

- Amazon Location Service (AWS SDK) — intégration native AWS mais verrouillage
- HERE Maps — alternative premium
- GeoAI Skills — satellite imagery (niche)

## Exemples GitHub à étudier

1. **Fleet-Analytics-Dashboard/Application** — fleet tracking Mapbox + Next.js
2. **yashitiwary/delivery-tracking** — Next.js 15 + MapLibre + role-based dashboards
3. **mapbox/mapbox-agent-skills** — exemples officiels Mapbox pour agents Claude

## Stack recommandée DSPilot

```
Frontend : Next.js 16 + react-map-gl + deck.gl (heatmap layer)
Backend  : Convex mutation geocodeAddress() → BAN API (free)
Reports  : Claude Python agent → folium → PNG/PDF
Fallback : MapLibre GL si Mapbox cost devient trop élevé
```

---

# 3. Charts & Data Viz

## S-tier (must-have)

### Recharts
- **Install** : `npm install recharts`
- **Usage DSPilot** : dashboard principal — trends 4-semaines, tier bars, leaderboards. SVG crisp pour export, TS natif, courbe d'apprentissage plate.

### Vega-Lite (declarative JSON)
- **Install** : `npm install vega vega-lite` ou `pip install altair` (Python)
- **Usage DSPilot** : pitch decks McKinsey-grade (waterfall, bullet, small multiples). Claude génère JSON spec depuis Convex → rendu PNG server-side via Puppeteer/Kaleido.
- **MCP** : Vega-Lite MCP dispo

### Mermaid Diagrams
- **Install** : MCP Mermaid (Claude Desktop) ou `npm install mermaid`
- **Usage DSPilot** : Gantt de timeline, flowcharts classification DNR, diagrammes onboarding

### Claude Artifacts (Recharts live)
- **Install** : natif Claude Pro/Team
- **Usage DSPilot** : **killer move en pitch call** → "laisse-moi te montrer" → Claude génère un dashboard interactif en 20s, tu filtres en live. GA April 2026.

## A-tier

- **Apache ECharts** — leaderboards 100+ drivers, 3D, WebGL (overkill mais power-user)
- **Nivo** — animations premium (tier distrib heatmap par semaine)
- **Observable Plot** — exploratoire rapide, grammar-of-graphics 50KB
- **Tremor** (Vercel) — metric cards Tailwind drop-in basé sur Recharts

## B-tier

- **Visx** (Airbnb) — control total pixel par pixel, quand Recharts limite
- **Datawrapper API** — pitch charts pro embeddables, freemium
- **Vega-Lite + Kaleido/Puppeteer** — pipeline server-side pour PDF reports hebdo

## Skip

- Highcharts ($2000/dev/an commercial)
- AG Charts (overkill enterprise)
- Plotly.js (3MB, trop lourd)

## 6 patterns à maîtriser pour pitch decks DSP

1. **DWC Trend + Target Band** — line chart 4 semaines avec zone 88-95% shaded, target line 93%. Animation d'entrée.
2. **Waterfall Completion Funnel** — 113 drivers total → −12 DNR → −8 Poor → −15 Fair → 78 Great/Fantastic. Couleurs par tier.
3. **Tier Distribution Small Multiples** — 4 panneaux (S14-S17), barres horizontales Poor/Fair/Great/Fantastic. Montre le mouvement week-over-week d'un coup d'œil.
4. **Sparkline + Trend Arrow** — carte métrique compact avec mini-line 60px + flèche ↑/↓. Pour top-3 leaderboards.
5. **DNR Donut Drill-down** — donut concentrique DNR count ↔ reason type. Click → breakdown animé.
6. **Leaderboard Tier-Colored Bars** — horizontal, couleur = tier, top 3 avec icône star.

## Stack recommandée DSPilot

```
Dashboard  : Recharts + Tremor (core) + Observable Plot (exploratoire)
Pitch deck : Vega-Lite JSON → PNG server-side (canonique)
Live demo  : Claude Artifacts (Recharts interactif en call)
Reports    : Vega-Lite + Puppeteer (nightly → PDF hebdo)
```

---

# 4. Business Intelligence

## S-tier

### Metabase MCP
- **Quoi** : MCP natif Metabase 60+, Claude query les dashboards, génère SQL, respecte les perms users
- **Install** : Docker Metabase + config MCP
- **Coût** : OSS gratuit / $80-500/mo managed
- **Usage DSPilot** : self-service analytics pour power users DSP ("filter drivers where DWC < 88% and tier dropped week-over-week")

### Looker MCP (Google Cloud)
- **Quoi** : Claude query Looker semantic layer, pas de SQL nécessaire
- **Coût** : GCP pricing, free tier dispo
- **Usage DSPilot** : alternative si tu passes sur GCP stack

### GoodData MCP
- **Quoi** : governed analytics, 24 tools AI-ready
- **Coût** : Enterprise custom
- **Usage DSPilot** : compliance-ready reports pour partenaires Amazon (plus tard)

## A-tier

- **Domo MCP** — dashboards interactifs dans Claude chat (~$2k/yr)
- **Qlik MCP** — 47 tools GA Feb 2026
- **CorpusIQ MCP** — 50+ sources unifiées (finance + sales + comms)
- **Convex + Resend + Claude batch** — solution native DSPilot : query Convex → Claude génère PDF/email → Resend delivery (DÉJÀ EN PLACE partiellement)

## Stack recommandée DSPilot

```
Court terme : Convex dashboard actuel + Claude Telegram agent = BI "suffisant"
Moyen terme : Metabase MCP self-hosted pour power users prospects
Long terme  : Looker ou GoodData pour Enterprise tier
```

---

# 5. Press / PR / Comms

## S-tier

### Apollo MCP ✅ déjà activé
- **Coût** : $49-499/mo
- **Usage DSPilot** : leads B2B — recherche DSP managers France par ville, enrichment, séquences

### Lemlist MCP
- **Quoi** : Claude rédige les séquences + déploie direct dans Lemlist
- **Install** : Claude MCP config + clé Lemlist
- **Coût** : $35-100/mo
- **Usage DSPilot** : cold email playbook (cf `DISTRIBUTION-PLAYBOOK.md` déjà rédigé)

### Beehiiv MCP
- **Quoi** : newsletter creation + analytics + scheduling (read-only v1)
- **Coût** : ~$99/mo
- **Usage DSPilot** : "DSPilot Weekly" à lancer semaine 8+ de distribution

## A-tier

- **HubSpot MCP** — sync Apollo → HubSpot deals (CRM natif), free tier OK
- **Typefully MCP** — LinkedIn/Twitter thread drafting + scheduling ($12.50/mo)
- **Buffer API** — cross-post 7+ réseaux ($6-48/mo)
- **Muck Rack API** — 250k journalists database, media monitoring ($10k/an — seulement si PR push sérieux)
- **Prezly** — press release publishing + newsroom FR ($100-600/mo — alternative Muck Rack)
- **Clay** — prospect research + AI email copywriting signal-based ($50-500/mo)

## B-tier

- **Resend MCP** — transactional email batch (pay-per-email, très cheap)
- Press release skill native Claude — draft templates

---

# 6. 90-day distribution playbook (consolidé)

**Objectif** : 10 stations DSP payantes d'ici fin Q2 2026.

### Semaines 1-2 — Ops setup
- Deploy **Metabase MCP** → Convex schema mapping → test queries ad-hoc
- Google Sheet "Target DSP France" (DIF1 + 50 stations IdF/Lyon/Marseille)
- Setup **Apollo + HubSpot** sync (Apollo → HubSpot deals)

### Semaines 3-4 — Cold outreach v1
- **Apollo** : search "Amazon DSP manager" par zone → liste 50
- **Clay** : drafting 3 templates FR via Claude (product-led, ROI, trial)
- **Lemlist** : séquence 2-touch (J0 intro, J5 follow-up), enroll 50

### Semaines 5-6 — Content cadence
- **Typefully** : LinkedIn post hebdo (Lundi 9h) sur DWC trends + wins
- **Buffer** : cross-post Twitter + newsletter teaser
- **Beehiiv** launch "DSPilot Weekly" (Dimanches) auto-populated depuis Metabase anomalies

### Semaines 7-9 — PR push + inbound
- **Muck Rack** ou **Prezly** → cherche journalistes Amazon Logistics / e-commerce
- Press release "DSPilot announces first customer" → seed 50 journalistes FR
- **HubSpot** : track conversion Apollo → replies → trials

### Semaines 10-13 — Scaling
- **Metabase** : dashboard "Lead Cohort" (source/stage/DWC vs benchmark)
- **Resend + Convex** : hebdo auto-email "Your DWC vs Benchmark" aux trials
- **Typefully** : 2-3 posts/semaine

### Semaines 14-15 — Second PR wave
- Press release "DSPilot atteint 10 stations — révèle les benchmarks DWC"
- **LinkedIn** long-form Ousmane "Comment les DSP managers Amazon peuvent 10x leur perf"

## Coût mensuel stack distribution

| Outil | Tier | Coût/mois | Rôle |
|---|---|---|---|
| Metabase MCP | S | $0-80 | Self-serve analytics |
| Apollo MCP | S | $49+ | Lead gen |
| Lemlist MCP | S | $35-100 | Email sequences |
| Beehiiv MCP | S | $99 | Newsletter |
| HubSpot MCP | A | $0-300 | CRM |
| Typefully | A | $12.50 | Social |
| Clay | A | $50-500 | AI copywriting |
| Muck Rack | A | ~$833 | Media DB (annuel) |
| Prezly | A | $100-600 | PR releases |
| Buffer | A | $6-48 | Distribution |
| **Total** | | **~$1.2k-2.5k/mo** | |

**ROI break-even** : ~2-3 stations payantes/mois (Pro 499€) couvrent le stack complet.

---

# 7. Action plan d'activation

## Cette semaine (gratuit / inclus)
1. Active **Gamma Connector** dans Claude settings (10 min)
2. `npm install -g @marp-team/marp-cli` (2 min)
3. `npm install recharts @tremor/react react-map-gl mapbox-gl @deck.gl/react vega vega-lite` dans DSPilot (5 min)
4. Test **Anthropic PPTX skill** avec un driver report demo (15 min)
5. Inscription gratuite Mapbox + clé API (10 min)

## Week 2 (low-cost)
6. Metabase OSS self-hosted sur Oracle Cloud (quand migration faite) — 30 min
7. Lemlist abonnement $35/mo + MCP config — 20 min
8. Première séquence cold email via Apollo + Lemlist — 1h

## Week 3+ (si premiers revenus)
9. Beehiiv launch newsletter
10. HubSpot si lead volume > 50/mois

---

# 8. Sources (tous agents de recherche)

**Présentations** : [Anthropic Skills Quickstart](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/quickstart), [Gamma Claude Integration](https://gamma.app/integrations/claude), [Marp GitHub](https://github.com/eruto-skills/marp), [Office PPTX MCP](https://github.com/GongRzhe/Office-PowerPoint-MCP-Server), [PptxGenJS](https://www.npmjs.com/package/pptxgenjs)

**Maps** : [Mapbox MCP blog](https://www.mapbox.com/blog/introducing-the-mapbox-model-context-protocol-mcp-server), [react-map-gl](https://visgl.github.io/react-map-gl/), [deck.gl](https://deck.gl/), [BAN API](https://api.gouv.fr/les-api/base-adresse-nationale), [OSM MCP](https://github.com/jagan-shanmugam/open-streetmap-mcp), [leafmap](https://leafmap.org/)

**Charts** : [Data Viz MCP Servers](https://chatforest.com/reviews/data-visualization-mcp-servers/), [Claude Artifacts visuals blog](https://claude.com/blog/claude-builds-visuals), [Top React Chart Libs 2026](https://querio.ai/articles/top-react-chart-libraries-data-visualization), [Observable Plot](https://observablehq.com/plot/getting-started), [McKinsey chart principles](https://umbrex.com/resources/the-busy-consultants-guide-to-quantitative-charts/design-principles-for-mckinsey-quantitative-charts/)

**BI + PR** : [Metabase MCP](https://www.metabase.com/docs/latest/ai/mcp), [Looker MCP](https://cloud.google.com/blog/products/business-intelligence/introducing-looker-mcp-server), [Apollo MCP launch](https://www.prnewswire.com/news-releases/apolloio-delivers-gtm-outbound-execution-to-claude-302695860.html), [Lemlist Claude](https://www.lemlist.com/blog/lemlist-claude-integration), [Beehiiv MCP](https://product.beehiiv.com/p/beehiiv-mcp), [Typefully](https://typefully.com/social-media-scheduling), [Muck Rack API](https://muckrack.com/pr-software/api), [Clay](https://www.clay.com/)

---

*Dernière mise à jour : 2026-04-25 — ré-exécute cette recherche tous les 2-3 mois, le marché MCP bouge vite.*
