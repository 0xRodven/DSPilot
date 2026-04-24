---
name: weekly-digest
description: Generate a weekly DSPilot digest (DWC/IADC/DNR + top/bottom drivers + anomalies + action plan) combining analytics-queries + generate-chart. Use for Monday morning recaps.
---

# weekly-digest — recap hebdo DSPilot

## Quand l'utiliser

- "Fais le recap de la semaine dernière"
- "Weekly report S16"
- "Prépare moi le briefing lundi matin"
- Appelé automatiquement par le cron Claude Cloud chaque lundi 06h UTC

## Étapes

1. **Déterminer la semaine cible**
   - "semaine dernière" = week courante − 1
   - "S17" = exactement cette semaine
   - Toujours vérifier que la semaine est **complète** (samedi passé)

2. **Query les 4 agrégats critiques** (utiliser `analytics-queries.md`)
   - DWC station global
   - IADC global
   - DNR total + breakdown par `scanType`
   - Tier distribution drivers (Fantastic/Great/Fair/Poor)

3. **Identifier les 3 anomalies** (utiliser query #17 anomaly detection)
   - DWC drop > 5 pts WoW
   - Contact Miss explosé (> 2× semaine précédente)
   - Nouveau driver sous 80% après 2 semaines

4. **Générer 2 charts** via `generate-chart.md`
   - Donut : DNR par scanType
   - Bar horizontal : top 10 drivers avec tier colors

5. **Composer le message Telegram** (format ci-dessous)

6. **Envoyer** via `mcp__plugin_telegram_telegram__reply` avec les 2 PNG

## Format output Telegram

```
📊 DSPilot — Recap S{WEEK}/{YEAR} (DIF1)

**Vue d'ensemble**
• DWC station : {DWC}% ({DELTA vs S-1})
• IADC : {IADC}%
• DNR concessions : {DNR_TOTAL} (S-1 : {DNR_PREV})
• Livreurs actifs : {DRIVERS_ACTIVE} / {DRIVERS_TOTAL}

**Tier distribution**
• 🟢 Fantastic (≥95%) : {N_FANTASTIC}
• 🔵 Great (≥90%) : {N_GREAT}
• 🟡 Fair (≥88%) : {N_FAIR}
• 🔴 Poor (<88%) : {N_POOR}

**Top 3**
1. {NAME_1} — {DWC_1}%
2. {NAME_2} — {DWC_2}%
3. {NAME_3} — {DWC_3}%

**À suivre (bottom 3)**
1. {NAME_B1} — {DWC_B1}% ({CAUSE_B1})
2. {NAME_B2} — {DWC_B2}% ({CAUSE_B2})
3. {NAME_B3} — {DWC_B3}% ({CAUSE_B3})

**Anomalies détectées**
{LIST_ANOMALIES ou "Aucune anomalie significative cette semaine."}

**Action plan suggéré**
1. {ACTION_1}
2. {ACTION_2}
3. {ACTION_3}
```

Suivi de 2 images jointes :
- `chart_donut_dnr_s{WEEK}.png`
- `chart_bar_top10_s{WEEK}.png`

## Logique de génération des "Actions"

Basé sur les anomalies détectées, prioriser dans cet ordre :

1. **Driver coaching urgent** — si un driver a un DWC < 80% OU une baisse > 5pts
   → "Coaching {name} : {cause} (deadline {jeudi/vendredi})"

2. **Pattern géographique** — si un code postal concentre > 30% des DNR
   → "Investiguer zone {postalCode} : {N_DNR} concessions, probable group stop / adresse bloquée"

3. **Peer-group stop** — si 2+ drivers ont DNR à la même adresse
   → "Group stop suspect {address} : {drivers} — débrief équipe"

## Exemple rendu (S16/2026 DIF1)

```
📊 DSPilot — Recap S16/2026 (DIF1)

Vue d'ensemble
• DWC station : 83.96% (-0.44 vs S15)
• IADC : 94.2%
• DNR concessions : 102 (S15 : 141)
• Livreurs actifs : 108 / 114

Tier distribution
• 🟢 Fantastic (≥95%) : 12
• 🔵 Great (≥90%) : 34
• 🟡 Fair (≥88%) : 28
• 🔴 Poor (<88%) : 34

Top 3
1. Mamadou CISSE — 97.3%
2. Sarah B. — 95.2%
3. Hassan D. — 93.8%

À suivre (bottom 3)
1. Kitenge — 82.1% (Contact Miss 18x)
2. Jamal — 84.6% (Unsuccessful Delivery 12x)
3. Jean Dupont — 86.3% (Signature issues 8x)

Anomalies détectées
• Kitenge : -1.8 pts vs S15 (à suivre de près)
• 36% des DNR concentrées sur 75018 (probable group stop Montmartre)

Action plan suggéré
1. Coaching Contact Miss — Kitenge (deadline jeudi)
2. Débrief équipe Montmartre : group stop 41 Rue Richer ?
3. Call 1:1 Jamal pour comprendre Unsuccessful Delivery
```

## Règles

- **Toujours envoyer EN TEMPS RÉEL** le lundi matin avant 8h Paris (le DSP manager doit pouvoir l'utiliser pour briefer ses livreurs à 9h)
- **Si la data manque** pour un chiffre, dire explicitement "(data partielle)" — jamais inventer
- **Si aucune anomalie** → dire "Aucune anomalie significative" (pas faker pour remplir)
- **Action plan = 3 max** (pas une to-do list de 10 items ingérable)
- **Toujours les 2 charts** (donut DNR + bar top10), jamais un seul
