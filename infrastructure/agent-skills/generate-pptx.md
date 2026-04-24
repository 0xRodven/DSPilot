---
name: generate-pptx
description: Generate a .pptx deck from a brief or DSPilot data (driver report, station weekly report, pitch deck). Use Marp for Markdown-first OR python-pptx for programmatic. Use when user asks "deck", "pptx", "powerpoint", "présentation".
---

# generate-pptx — decks PPTX

## Quand l'utiliser

- "Fais-moi un deck de la semaine pour DIF1"
- "PPTX driver report pour Kitenge"
- "Deck pitch pour envoyer à un prospect"
- "Rapport partenaire Amazon au format .pptx"

## Stratégie

**2 paths possibles :**

### A. Marp (80% des cas — Markdown-first, versionnable)

Utilisé quand le contenu est à dominante texte (slides rapport hebdo, recap partenaire). Claude écrit le Markdown, Marp compile en PPTX.

### B. python-pptx (20% — charts natifs, brand kit custom)

Utilisé quand on veut des **graphiques natifs PPTX** (pas des PNG incrustés) ou un brand kit persistant.

## Template Marp

Créer `/tmp/deck_${name}.md` :

```markdown
---
marp: true
theme: default
paginate: true
style: |
  section { background: #F5F3EE; color: #1A1A1A; font-family: 'Helvetica', sans-serif; }
  h1, h2 { color: #0F172A; font-family: 'Playfair Display', serif; }
  .tier-fantastic { color: #10B981; font-weight: 700; }
  .tier-poor { color: #EF4444; font-weight: 700; }
---

# DSPilot — Semaine 16
DIF1 · Paris · 114 livreurs

---

## Vue d'ensemble

- **DWC** : 83.96% (-0.44 vs S15)
- **IADC** : 94.2%
- **DNR** : 102 concessions (S15 : 141)
- **Top driver** : Mamadou CISSE <span class="tier-fantastic">95.2%</span>
- **À suivre** : Kitenge <span class="tier-poor">82.1%</span> (Contact Miss 18x)

---

![width:800px](/tmp/chart_s16_dnr.png)

---

## Action plan

1. Coaching Contact Miss — Kitenge (deadline jeudi)
2. Investigation DNR adresse 41 Rue Richer (2 colis même stop)
3. Suivre Jamal — DWC -2.3 pts depuis S14
```

Compilation :

```bash
marp /tmp/deck_dif1_s16.md -o /tmp/deck_dif1_s16.pptx --pptx-editable --allow-local-files
```

## Template python-pptx (chart natif + brand kit)

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE

# Brand palette DSPilot
PRIMARY = RGBColor(0x25, 0x63, 0xEB)
TEXT_DARK = RGBColor(0x0F, 0x17, 0x2A)
MUTED = RGBColor(0x8A, 0x8A, 0x8A)
BG_WARM = RGBColor(0xF5, 0xF3, 0xEE)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Slide 1 : Cover
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
title = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12), Inches(2))
tf = title.text_frame
p = tf.paragraphs[0]
p.text = "DSPilot"
p.font.size = Pt(80)
p.font.color.rgb = PRIMARY
p.font.bold = True

# Slide 2 : Chart DNR par catégorie (native PPTX, editable)
slide = prs.slides.add_slide(prs.slide_layouts[6])
chart_data = CategoryChartData()
chart_data.categories = ["Boîte aux lettres", "Réceptionniste", "Main propre", "Porte", "Autre"]
chart_data.add_series("DNR S16", (35, 31, 25, 7, 4))
chart = slide.shapes.add_chart(
    XL_CHART_TYPE.DOUGHNUT, Inches(3), Inches(1.5), Inches(7), Inches(5),
    chart_data
).chart
chart.has_title = True
chart.chart_title.text_frame.text = "DNR S16/2026 — DIF1"

prs.save("/tmp/deck_dif1_s16.pptx")
```

## Structure d'un deck driver report (hebdo)

1. **Cover** : "Rapport S16 — Kitenge" + logo DSPilot + date
2. **KPI hero** : DWC individuel (grande taille) + tier badge + delta vs S15
3. **Breakdown erreurs** : Contact Miss, Photo Defect, No Photo (bar horizontal)
4. **Comparaison peer** : Kitenge vs moyenne station vs top 3
5. **Action plan IA** : 3 suggestions coaching ciblées
6. **Footer** : stats confidentielles / contact coach

## Structure d'un deck station weekly report

1. Cover : station + semaine + logo
2. Vue d'ensemble (DWC, IADC, DNR totaux)
3. Tier distribution (donut)
4. Top 3 / Bottom 3 drivers
5. DNR par scanType (pie)
6. DNR timeline 4 semaines (line)
7. Action plan propriétaire

## Règle finale

Après avoir généré le `.pptx`, **upload sur Telegram via `mcp__plugin_telegram_telegram__reply`** en tant que document (pas image). Accompagne avec un résumé 3 lignes des insights clés du deck.

```python
# Reply format
{
  "chat_id": "-5134870063",
  "text": "Deck S16/DIF1 prêt. Contacts miss explose chez Kitenge (18x) — deck inclut action plan. 12 slides.",
  "reply_to": "<message_id_original>",
  "attachments": ["/tmp/deck_dif1_s16.pptx"]
}
```
