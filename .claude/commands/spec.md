# /spec — Template de tâche one-shot

Utilise ce template AVANT de commencer toute feature ou bug fix.
Remplis chaque section, puis dis "go" pour que Claude implémente sans rethinking.

---

## Task: [Nom de la feature / bug]

### Contexte (1-2 lignes)
_Ce que c'est, pourquoi maintenant._

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Décisions techniques (tu décides)
- _Ex: utiliser Convex mutation, pas de nouvelle dépendance_
- _Ex: modifier uniquement `convex/coaching.ts` et le composant X_

### Critères de succès
- [ ] Fonctionne en local
- [ ] TypeScript OK (`npx tsc --noEmit`)
- [ ] Lint OK (`npm run lint`)
- [ ] Pas de régression sur les features existantes

### Fichiers concernés (si connus)
- `convex/...`
- `src/...`

### Gotchas à éviter
- _Ex: ne pas toucher convex/_generated/_
- _Ex: semaines Amazon = dimanche-samedi_

---

**Instructions pour Claude :**
Lis le spec ci-dessus. Pose des questions si confiance < 95%. Sinon, implémente directement en suivant le plan — ne rethink pas les décisions déjà prises.
