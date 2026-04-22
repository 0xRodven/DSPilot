---
globs:
  - "src/lib/parser/**"
  - "convex/imports*"
  - "convex/drivers*"
  - "convex/stats*"
---

# Règles Import Amazon — DSPilot

## Convention semaines Amazon (CRITIQUE)
- Semaines Amazon : **dimanche → samedi** (PAS ISO lundi → dimanche)
- Utiliser `getWeek/getWeekYear` avec `{ weekStartsOn: 0 }` — JAMAIS `getISOWeek`
- Bug corrigé dans 14 fichiers (commits b14b420, c45d0c0) — ne pas réintroduire

## Import multi-semaines
- **Jamais importer >1 semaine d'un coup** — risque de corruption données
- Toujours valider le format HTML avant d'importer
- Parser : `src/lib/parser/index.ts` — ne pas modifier sans les tests

## Gotchas Amazon
- Le scraper VPS tourne sur openclaw (Hetzner) — `/root` sur volume 300G SSD
- Deploy keys différents : dev = pastel-snail-181, prod = sincere-rhinoceros-718
- Résultat DWC S14 = 86.31% (vérifier contre ce chiffre si problème de parsing)
