# Weekly Report - Resume Performance Hebdo

Genere un resume de performance hebdomadaire pour la station.

## Usage

```
/weekly-report [year-week] [--format pdf|markdown|whatsapp]
```

## Formats

| Format | Description | Output |
|--------|-------------|--------|
| markdown | Rapport texte complet | Console |
| pdf | Export PDF avec graphiques | Fichier |
| whatsapp | Messages individuels drivers | Liste |

## Process

### 1. Collecte Donnees

- Recuperer stats station pour la semaine
- Obtenir stats tous les drivers
- Calculer moyennes fleet
- Determiner distribution tiers

### 2. Analyse

- Identifier top/bottom performers
- Calculer tendances week-over-week
- Lister actions coaching en pending
- Resumer alertes generees

### 3. Generation

- Formater selon --format
- Inclure visualisations pour PDF
- Generer messages WhatsApp individuels

## Output Markdown

```
# Rapport Semaine [XX] - [Station]

## Resume Fleet

| Metrique | Valeur | vs Semaine Precedente |
|----------|--------|----------------------|
| DWC Fleet | XX.X% | +/-X.X% |
| IADC Fleet | XX.X% | +/-X.X% |
| Drivers Actifs | XX | +/-X |

## Distribution Tiers

| Tier | Count | % |
|------|-------|---|
| Fantastic | XX | XX% |
| Great | XX | XX% |
| Fair | XX | XX% |
| Poor | XX | XX% |

## Top 5 Performers

| Rang | Driver | DWC | Trend |
|------|--------|-----|-------|
| 1 | [nom] | XX.X% | [arrow] |
| ... | ... | ... | ... |

## Attention Requise (Bottom 5)

| Rang | Driver | DWC | Issue | Coaching |
|------|--------|-----|-------|----------|
| XX | [nom] | XX.X% | [erreur] | [status] |
| ... | ... | ... | ... | ... |

## Alertes Generees

- XX alertes cette semaine
- [resume par type]

## Actions Coaching

- XX actions en pending
- XX overdue (> 14 jours)
```

## Skills Utilises

- `weekly-recap` - Structure et generation
- `tier-calculator` - Classification
- `kpi-alerts` - Alertes

## Instruction

$ARGUMENTS

## Contexte

- Default: semaine courante, format markdown
- Pour PDF: utiliser le systeme d'export existant
- Pour WhatsApp: generer uniquement, ne pas envoyer
