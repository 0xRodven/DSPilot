# Wiki Lint — Vérifier la santé du wiki

Exécute un health check complet du wiki DSPilot.

## Processus

1. **Lire le schema** — `~/wiki/CLAUDE.md`
2. **Lire l'index** — `~/wiki/wiki/index.md`
3. **Scanner toutes les pages wiki** — `~/wiki/wiki/*.md`
4. **Vérifier** :
   - [ ] Contradictions entre pages
   - [ ] Pages orphelines (aucun lien entrant)
   - [ ] Concepts mentionnés sans page dédiée (wikilinks cassés)
   - [ ] Cross-refs qui pointent vers des pages inexistantes
   - [ ] Pages avec `confidence: low` ou `updated` > 30 jours
   - [ ] Frontmatter manquant ou incomplet
   - [ ] Index.md désynchronisé avec les pages réelles
5. **Rapport** :
   - Score santé global (X/10)
   - Liste des problèmes par catégorie
   - Suggestions de sources à ajouter
   - Suggestions de pages à créer
6. **Appendre au log** — `~/wiki/wiki/log.md`
7. **Optionnel** : Corriger automatiquement les problèmes simples (cross-refs, index sync)

## Output

Rapport structuré avec actions recommandées.
