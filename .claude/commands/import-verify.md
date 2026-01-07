# Import Verify - Validation Amazon Data

Valide un fichier HTML Amazon avant ou apres import.

## Usage

```
/import-verify [path-to-html-file]
```

## Process

### 1. Validation Pre-Import (si fichier fourni)

- Parser HTML avec skill amazon-parser
- Extraire et decoder les CSVs base64
- Verifier code station
- Valider coherence dates/semaines
- Compter drivers attendus

### 2. Validation Post-Import (si pas de fichier)

- Query dernier import pour station actuelle
- Comparer drivers attendus vs importes
- Verifier stats daily/weekly presentes
- Valider distribution des tiers
- Lister warnings/erreurs de l'import

## Output Format

```
=== VALIDATION IMPORT ===

Fichier: [nom du fichier]
Station: [code]
Semaine: [annee]-W[numero]

Statut: PASS / FAIL / PARTIAL

Drivers:
- Attendus: XX
- Importes: XX
- Manquants: [liste]

Stats:
- Daily: XX records
- Weekly: XX records

Distribution Tiers:
- Fantastic: XX (XX%)
- Great: XX (XX%)
- Fair: XX (XX%)
- Poor: XX (XX%)

Warnings:
- [liste des warnings]

Erreurs:
- [liste des erreurs]

Actions Recommandees:
- [suggestions]
```

## Skills Utilises

- `amazon-parser` - Parsing HTML/CSV
- `data-import` - Validation et lifecycle

## Instruction

$ARGUMENTS

## Contexte

- Verifier que le fichier HTML est un report Amazon valide
- Utiliser les patterns de `/src/lib/parser/`
- Ne pas modifier la base de donnees en mode validation
- Reporter toutes les anomalies detectees
