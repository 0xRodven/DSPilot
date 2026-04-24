---
name: generate-chart
description: Generate polished matplotlib charts (bar/line/pie/donut/waterfall) from Convex data, save as PNG, and reply to Telegram. Use when user asks for "graphique", "chart", "camembert", "courbe", "histogramme", "répartition", "répartis", etc.
---

# generate-chart — charts DSPilot standardisés

## Quand l'utiliser

Tout message Telegram demandant une visualisation d'une métrique DSPilot :
- "fais-moi un graphique DWC par livreur S17"
- "camembert des catégories DNR"
- "courbe de l'évolution des concessions sur 4 semaines"
- "top 10 drivers sous forme de barres"

## Étapes (ordre obligatoire)

1. **Query Convex** pour obtenir les données. Voir `analytics-queries.md` pour les patterns pré-écrits (top/bottom, deltas WoW, tier distrib, DNR par scanType, etc.)
2. **Choisir le type de chart** selon la nature :
   - Distribution catégorielle (DNR par type) → **donut** ou **pie**
   - Comparaison drivers → **bar horizontal** avec couleur par tier
   - Évolution temporelle → **line** avec zone cible 88-95% shaded
   - Drill-down multi-dim → **stacked bar** ou **small multiples**
3. **Utiliser le template `/opt/dspilot-agent/scripts/chart_template.py`** pour garantir cohérence (police, couleurs tier, légende FR)
4. **Save en PNG** dans `/tmp/chart_${timestamp}.png`
5. **Reply Telegram** avec `mcp__plugin_telegram_telegram__reply` + l'image + un résumé 1-2 lignes (total, top pattern, insight actionable)

## Couleurs DSPilot standard (à TOUJOURS respecter)

```python
TIER_COLORS = {
    "fantastic": "#34D399",   # emerald-400
    "great":     "#60A5FA",   # blue-400
    "fair":      "#FBBF24",   # amber-400
    "poor":      "#F87171",   # red-400
}
PRIMARY = "#2563EB"
MUTED = "#8A8A8A"
BG_WARM = "#F5F3EE"
TEXT_DARK = "#1A1A1A"
```

## Template matplotlib de base

```python
import matplotlib.pyplot as plt
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.facecolor": "#F5F3EE",
    "axes.facecolor": "#FFFFFF",
})
fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
# ... plot ...
ax.set_title("DNR S16/2026 — DIF1", fontsize=14, weight="bold", color="#1A1A1A", pad=16)
ax.set_ylabel("Concessions", color="#8A8A8A")
plt.tight_layout()
plt.savefig("/tmp/chart_s16_dnr.png", dpi=150, bbox_inches="tight", facecolor="#F5F3EE")
```

## Patterns spécifiques

### 1. Bar horizontal tier-colored (leaderboard drivers)

```python
# data = [{"name": "Kitenge", "dwc": 82.1, "tier": "poor"}, ...]
colors = [TIER_COLORS[d["tier"]] for d in data]
ax.barh([d["name"] for d in data], [d["dwc"] for d in data], color=colors)
ax.axvline(93, color="#8A8A8A", linestyle="--", alpha=0.5, label="Target 93%")
```

### 2. Donut catégoriel (DNR par scanType)

```python
sizes = [35, 31, 25, 7, 7, 4]
labels = ["Boîte aux lettres", "Réceptionniste", "Main propre", "Inconnu", "Porte", "Autre lieu sûr"]
colors = [PRIMARY, "#3B82F6", "#60A5FA", "#8A8A8A", "#F87171", "#FBBF24"]
wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors,
    autopct="%1.0f%%", pctdistance=0.8, startangle=90,
    wedgeprops=dict(width=0.4, edgecolor="#FFFFFF", linewidth=2))
ax.text(0, 0, f"{sum(sizes)}\nDNR", ha="center", va="center", fontsize=18, weight="bold")
```

### 3. Line + target band (DWC 4-semaines)

```python
weeks = ["S14", "S15", "S16", "S17"]
dwc = [86.31, 84.40, 83.96, 84.20]
ax.fill_between(weeks, 88, 95, color="#E0F2FE", alpha=0.4, label="Zone cible 88-95%")
ax.axhline(93, color=MUTED, linestyle="--", alpha=0.5, label="Target 93%")
ax.plot(weeks, dwc, color=PRIMARY, marker="o", linewidth=2.5)
for w, d in zip(weeks, dwc):
    ax.annotate(f"{d}%", (w, d), textcoords="offset points", xytext=(0, 10), ha="center", fontsize=10)
```

### 4. Waterfall (completion funnel)

```python
# Claude écrit le waterfall directement avec ax.bar + transparency
# total=113, -12 DNR, -8 Poor, -15 Fair, =78 Great+Fantastic
```

### 5. Small multiples (tier distrib par semaine)

```python
fig, axes = plt.subplots(1, 4, figsize=(14, 4), sharey=True)
for ax_i, (week, dist) in zip(axes, weekly_tier_distrib.items()):
    tiers = ["poor", "fair", "great", "fantastic"]
    ax_i.bar(tiers, [dist[t] for t in tiers], color=[TIER_COLORS[t] for t in tiers])
    ax_i.set_title(f"S{week}", fontsize=11)
```

## Règles pour le reply Telegram

- Toujours envoyer le PNG ET un résumé texte 2-3 lignes en dessous
- Format : `[Titre clair]\n\n• Point 1 (chiffre saillant)\n• Point 2 (anomalie ou pattern)\n• Action suggérée si pertinente`
- Si la semaine demandée est INCOMPLÈTE (en cours), préciser : "S17 encore en cours — données partielles"
