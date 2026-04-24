# Claude Agent Skills Arsenal — DSPilot Brain

> Skills activables **gratuitement** sur l'agent DSPilot Brain (Telegram 24/7, VPS) pour qu'il fasse slides, maps, charts, analytics et drafts de comms à la demande.
>
> **Règle d'or** : que du free tier / OSS, installable côté VPS (npm/pip/binary), pas de OAuth SaaS payant.
>
> Dernière MAJ : 2026-04-25

---

## TL;DR — ce que l'agent doit savoir faire en +

Quand Ousmane DM son bot :

| Demande | Skill mobilisé | Output |
|---|---|---|
| "fais-moi un deck DIF1 S17" | `pptx-generator` | `.pptx` attaché au message TG |
| "carte des DNR cette semaine" | `map-generator` | PNG map envoyé |
| "chart DWC top 10 drivers" | `chart-generator` | PNG chart envoyé |
| "écris un post LinkedIn sur nos chiffres" | `content-drafter` | texte collable |
| "envoie le rapport hebdo à thierry@dsp.fr" | `gmail` (déjà en place) | email envoyé |
| "sort le top 5 livreurs qui ont dérapé S16→S17" | `metabase-analyst` | markdown table |

---

## 1. Slides / PPTX (100% gratuit)

### Anthropic PPTX skill ⭐ déjà dispo
- **Accès** : built-in Max plan, rien à installer
- **Usage agent** : dans un skill `.md`, dire au Claude : "génère un pptx"
- **DSPilot** : driver reports hebdo, pitch deck pour un prospect

### Marp CLI
- **Install sur VPS** :
  ```bash
  npm install -g @marp-team/marp-cli
  apt install -y chromium-browser  # pour export PPTX/PDF
  ```
- **Usage agent** : l'agent écrit markdown, puis `marp slides.md -o deck.pptx --pptx-editable`
- **Pourquoi** : format versionnable, agent itère à chaque demande sans repartir de zéro

### PptxGenJS
- **Install** : `npm install pptxgenjs` dans `/opt/dspilot-agent/lib/`
- **Usage agent** : skill TS qui transforme une query Convex en slides (chart + table + KPI hero)
- **Pourquoi** : control total quand Marp limite (graphs natifs PPTX, animations)

### Office-PowerPoint-MCP-Server (python-pptx)
- **Install** : `git clone GongRzhe/Office-PowerPoint-MCP-Server && pip install -r requirements.txt`
- **MCP config** : ajouter le server dans `/opt/dspilot-agent/.mcp.json`
- **Usage agent** : 32 outils python-pptx disponibles via MCP (add_slide, add_chart, add_image, set_background, etc.)
- **Pourquoi** : le plus granulaire, pour brand kits persistants

**Stack agent recommandée** : **Marp** pour 80% des cas + **PptxGenJS** quand on veut des charts natifs dans le PPTX.

---

## 2. Maps / Géospatial (100% gratuit)

### Adresse.data.gouv.fr (BAN) ⭐ must-have
- **Gratuit 100%** — geocoding officiel gouvernement FR
- **Install** : `curl` direct, pas de SDK
- **Usage agent** :
  ```bash
  curl "https://api-adresse.data.gouv.fr/search/?q=10+rue+de+Paris+Ivry&limit=1"
  ```
- **DSPilot** : geocode toutes les concessions DNR batch au moment du scrape

### folium + leafmap (Python)
- **Install sur VPS** : `pip install folium leafmap contextily`
- **Usage agent** : skill `generate_delivery_map.py` qui read Convex → folium Map → save PNG
- **Pourquoi** : rendu static PNG (bon pour envoyer via Telegram), tuiles OSM gratuites, clusters/heatmaps built-in

### OpenStreetMap MCP (jagan-shanmugam/open-streetmap-mcp)
- **Install** :
  ```bash
  git clone https://github.com/jagan-shanmugam/open-streetmap-mcp
  # Config dans .mcp.json
  ```
- **Usage agent** : routing, distance matrix, POI search — tout gratuit via Overpass/OSRM publics
- **Pourquoi** : remplace Mapbox complètement pour les besoins "où sont mes drivers, quelle distance entre 2 stations"

### MapLibre GL JS (pour le dashboard Next.js, pas l'agent)
- `npm install maplibre-gl react-map-gl` — OSS fork de Mapbox pré-v3, marche avec tuiles OSM gratuites
- Pour plus tard quand tu ajoutes la vue map dans le dashboard DSPilot

**Stack agent recommandée** : **BAN** pour geocoding + **folium** pour rendre des PNG maps envoyables sur Telegram.

---

## 3. Charts / Data Viz (100% gratuit)

### matplotlib + seaborn (Python) ⭐ le plus simple pour l'agent
- **Install** : `pip install matplotlib seaborn pandas`
- **Usage agent** : skill `chart.py` qui query Convex → DataFrame → matplotlib → PNG
- **Pourquoi** : l'agent peut scripter ça en 20 lignes, headless, pas de navigateur

### Vega-Lite + vl-convert (Python headless render)
- **Install** : `pip install vl-convert-python altair`
- **Usage agent** : Claude écrit spec Vega-Lite JSON (grammar of graphics), `vl-convert` rend en PNG en local (pas besoin de browser/Puppeteer)
- **Pourquoi** : specs déclaratives stables, McKinsey-grade par design (waterfall, bullet, small multiples)

### Observable Plot (si tu veux rester en JS)
- **Install** : `npm install @observablehq/plot @observablehq/domino`
- **Usage agent** : node script → SVG string → `sharp` convert PNG
- **Pourquoi** : syntaxe compacte, même lib côté dashboard Next.js plus tard

### Mermaid MCP (flowcharts, Gantt, séquences)
- **Install** : `npm install -g @mermaid-js/mermaid-cli` (`mmdc` binary) + Mermaid MCP server
- **Usage agent** : pour diagrammes (timeline campagne coaching, flow classification DNR)
- **Pourquoi** : 0 effort design, version-control friendly

### Apache ECharts (via `pyecharts` Python)
- **Install** : `pip install pyecharts snapshot-selenium`
- **Usage agent** : charts enterprise-grade, export PNG
- **Pourquoi** : quand matplotlib c'est trop moche pour ce qu'on veut montrer au prospect

**Stack agent recommandée** : **matplotlib+seaborn** pour 80% (rapports DSPilot classiques) + **vl-convert + Vega-Lite** pour les charts McKinsey-grade du pitch.

---

## 4. Business Intelligence (100% gratuit self-hosted)

### Metabase OSS (self-hosted)
- **Install sur VPS** :
  ```bash
  docker run -d -p 3000:3000 \
    -e MB_DB_TYPE=h2 \
    --name metabase metabase/metabase:v0.50
  ```
- **MCP config** : Metabase MCP server (OSS, https://github.com/metabase/metabase-mcp)
- **Usage agent** : "top 5 drivers DWC drop S16→S17" → agent call Metabase query → renvoie markdown table
- **Pourquoi** : pas besoin de Looker/GoodData payants, Metabase OSS couvre 100% des besoins DSP analytics

### Apache Superset (alternative Metabase)
- **Install** : Docker aussi
- **Usage agent** : plus puissant que Metabase pour dashboards partagés mais setup plus lourd
- **Verdict** : Metabase suffit pour DSPilot aujourd'hui

### Cube.dev (semantic layer OSS)
- **Install** : `npm install -g @cubejs-backend/cli`
- **Usage agent** : expose un schema Convex-compatible sur HTTP, l'agent query en SQL naturel
- **Pourquoi** : si tu veux que les clients Pro aient un "query playground" embedded dans DSPilot plus tard

### Convex + Claude direct (already working)
- **Usage agent** : l'agent sait déjà `npx convex data` et `npx convex run`
- **Skill à créer** : `analytics-queries.md` avec 10-20 queries-types documentées (top/bottom, deltas WoW, cohortes) que l'agent appelle au lieu d'improviser

**Stack agent recommandée** : Pour **maintenant** = skill `analytics-queries.md` avec queries Convex pre-écrites. Pour **plus tard** (power users) = Metabase OSS self-hosted.

---

## 5. Press / PR / Comms (free-tier only)

### Gmail MCP ⭐ déjà activé
- **Usage agent** : envoie emails (rapports hebdo clients, follow-ups prospects)
- **Skill utile** : `draft-and-send.md` avec templates de mail (onboarding, relance J+3, release note)

### Resend (free tier 3k emails/mois)
- **Install** : `pip install resend` ou SDK Node
- **Usage agent** : email transactionnel (reports drivers, alertes DWC drop) — complément Gmail pour envois programmatiques
- **Pourquoi** : free tier généreux, meilleure deliverability que SMTP perso

### Press release skill (native Claude, 100% gratuit)
- **Install** : créer `/opt/dspilot-agent/.claude/skills/press-release.md`
- **Usage agent** : templates FR "DSPilot annonce X" + liste journalistes FR à cibler (Les Échos, Journal du Net, Maddyness)
- **Pourquoi** : pas besoin de Prezly $600/mo — la valeur c'est le prompt engineering, pas la plateforme

### Apollo MCP (free tier limité mais utilisable)
- **Déjà activé** sur ton Claude Code
- **Usage agent** : search prospects DSP FR par ville, enrichissement — free tier = 150 crédits/mois, suffit pour bootstrap

### LinkedIn post drafter (skill custom)
- **Install** : créer `/opt/dspilot-agent/.claude/skills/linkedin-drafter.md`
- **Usage agent** : templates posts "DSPilot weekly insights" avec hook + story + CTA
- **Pourquoi** : Typefully/Buffer payant = overkill pour 1 post/semaine. Tu postes toi-même, l'agent draft.

**Stack agent recommandée** : **Gmail MCP** (actif) + **press-release skill** + **linkedin-drafter skill** + **Resend** pour le transactionnel. Apollo free tier pour bootstrap. Zéro euro.

---

## 6. Méta-skill : coordination & mémoire (gratuit)

### Convex-as-memory
- **Usage agent** : utiliser une table `agentMemory` (déjà dispo) pour stocker contextes longs (preferences user, décisions passées, liste prospects travaillés)
- **Pourquoi** : pas besoin de vector store payant — Convex fait full-text search + on a déjà le schéma

### Wiki sync (déjà en place)
- `~/wiki → /root/wiki` sync hourly via systemd
- L'agent peut read `/root/wiki/wiki/hot-DSPilot.md` à chaque démarrage

### meta-harness (déjà scaffolded)
- Ton framework pour améliorer l'agent week-over-week via eval automatique
- Gratuit, tourne sur ton compte Max

---

## 7. Action plan (0€, activable ce week-end)

### Phase 1 — packages VPS (30 min)
Sur Hetzner (ou futur Oracle) :
```bash
# Python stack
pip install matplotlib seaborn pandas folium leafmap altair vl-convert-python pyecharts python-pptx resend

# Node stack
npm install -g @marp-team/marp-cli @mermaid-js/mermaid-cli
cd /opt/dspilot-agent && npm install pptxgenjs @observablehq/plot sharp

# System
apt install -y chromium-browser  # pour exports headless
```

### Phase 2 — skills files à créer (1h)

Créer dans `/opt/dspilot-agent/.claude/skills/` :

1. **`generate-pptx.md`** — l'agent sait produire un deck .pptx depuis une demande naturelle (Marp-first, PptxGenJS fallback)
2. **`generate-map.md`** — l'agent sait geocoder (BAN) + folium + save PNG
3. **`generate-chart.md`** — 5 patterns docs (DWC trend, waterfall, leaderboard, donut DNR, small multiples)
4. **`analytics-queries.md`** — 20 queries Convex pré-écrites (top/bottom, deltas WoW, cohortes coaching)
5. **`draft-linkedin.md`** — templates posts FR
6. **`draft-email-outreach.md`** — templates cold + relance + upsell
7. **`press-release.md`** — templates FR + liste médias DSP

### Phase 3 — MCP config (30 min)
Ajouter dans `/opt/dspilot-agent/.mcp.json` :
- Office-PowerPoint-MCP-Server
- OpenStreetMap MCP
- Metabase MCP (quand Metabase installé)
- Mermaid MCP

### Phase 4 — test (15 min)
Envoyer 5 demandes au bot Telegram :
- "fais un pptx driver report DIF1 S17"
- "chart top 10 DWC S17"
- "map des DNR concessions S17"
- "draft un post LinkedIn sur nos 102 concessions S16"
- "top 5 drivers qui ont dérapé S16→S17 en markdown"

Si chaque demande produit un artefact correct → phase 5.

### Phase 5 — documenter dans meta-harness
Ajouter ces 5 demandes à `eval_set.jsonl` comme benchmark permanent. Futures itérations du meta-harness évalueront la qualité.

---

## 8. Ce qu'on écarte explicitement (payant)

| Tool | Pourquoi on passe |
|---|---|
| Gamma Pro | Free tier suffit si tu l'utilises côté toi, l'agent n'en a pas besoin |
| Lemlist, Instantly, Smartlead | Gmail + Resend gratuits font le taf pour 1-10 prospects/jour |
| Beehiiv | Pas de newsletter avant 50+ clients |
| Muck Rack, Prezly | Mail journalistes manuel suffit à ton échelle |
| HubSpot | Notion gratuit OU Google Sheets fait pareil |
| Buffer, Typefully | Tu postes toi-même, l'agent draft |
| Mapbox paid | BAN + OSM tiles = 100% gratuit et largement suffisant |
| Looker, Domo, Qlik, GoodData | Metabase OSS couvre tout |
| Highcharts, AG Charts | ECharts OSS couvre tout |

---

## 9. Budget réel

**Marginal cost** : **0€/mois**

Tout tourne sur :
- VPS existant (Hetzner aujourd'hui, Oracle Cloud free plus tard)
- Claude Max plan (déjà payé, partagé BreakIn)
- Convex prod (déjà payé, couvert par tier actuel)
- Gmail perso (gratuit)
- Apollo free tier (150 crédits/mois, bootstrap)

Les seuls coûts qui augmentent avec le volume :
- Convex prod quand tu dépasses 1M function calls/mois (probable vers 20+ clients)
- Resend au-delà de 3k emails/mois (probable vers 50+ clients)

---

## 10. Sources recherche

Liste brute des sources scannées par les 4 agents Opus (filtrée free-only) :

- [Anthropic Agent Skills Quickstart](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/quickstart)
- [Marp GitHub](https://github.com/marp-team/marp-cli)
- [PptxGenJS](https://www.npmjs.com/package/pptxgenjs)
- [Office-PowerPoint-MCP-Server](https://github.com/GongRzhe/Office-PowerPoint-MCP-Server)
- [BAN API gouv.fr](https://api.gouv.fr/les-api/base-adresse-nationale)
- [folium GitHub](https://github.com/python-visualization/folium)
- [leafmap](https://leafmap.org/)
- [OpenStreetMap MCP](https://github.com/jagan-shanmugam/open-streetmap-mcp)
- [Vega-Lite + vl-convert](https://github.com/vega/vl-convert)
- [Observable Plot](https://observablehq.com/plot)
- [Apache ECharts + pyecharts](https://pyecharts.org/)
- [Metabase OSS](https://www.metabase.com/start/oss/)
- [Metabase MCP](https://www.metabase.com/docs/latest/ai/mcp)
- [Cube.dev OSS](https://cube.dev/)
- [Resend free tier](https://resend.com/pricing)
- [Claude Artifacts visuals](https://claude.com/blog/claude-builds-visuals)
