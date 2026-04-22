# /handoff — DSPilot Handoff

Génère un handoff de session DSPilot compact (<2K tokens) pour reprendre sans re-expliquer.

## Instructions pour Claude

Produis directement ce document (pas de questions) :

```markdown
# Handoff DSPilot — [DATE]

## Fait cette session
- [bullet — 1 ligne max]

## Décisions techniques
- [Décision] → [Pourquoi] → [Rejeté : X]

## État
- Fichiers modifiés : [liste courte]
- `npx tsc --noEmit` : ✅/❌
- `npm run lint` : ✅/❌
- Convex env : dev (pastel-snail-181) / prod (sincere-rhinoceros-718)
- Branch : [branch]

## Prochaines étapes
1.
2.
3.

## Gotchas session
- [ce qui a failli mal se passer]

## Pour reprendre
- Lire : `~/wiki/wiki/hot-DSPilot.md`
- Fichier clé : `[chemin]`
```

Sauvegarde dans `.claude/handoffs/YYYY-MM-DD.md`.
