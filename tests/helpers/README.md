# Test Helpers

Instructions réutilisables pour les tests avec Claude Chrome.

## Authentification

### Session Clerk

L'extension Chrome utilise la session Clerk existante dans le navigateur.

**Vérifier l'auth:**
1. Chercher avatar/initiales en haut à droite
2. Si absent: session expirée

**Se reconnecter:**
1. Aller sur `http://localhost:3005`
2. Clerk redirige vers page login
3. Se connecter avec credentials test
4. Reprendre le test

### Timeout session

La session Clerk expire après ~60 minutes d'inactivité.
Si les tests échouent sur auth, se reconnecter.

---

## Attente Convex

Convex utilise des queries réactives. Après navigation:

### Attendre le chargement

1. Observer les éléments `.animate-pulse` (skeletons)
2. Attendre qu'ils disparaissent
3. Timeout max: 10 secondes

### Après mutations

Après création/modification de données:
1. Attendre ~500ms minimum
2. Chercher toast de confirmation
3. Vérifier que les données apparaissent

### Si timeout

- Vérifier `npx convex dev` actif
- Vérifier network dans DevTools
- Possiblement erreur query → checker console

---

## Screenshots

### Naming convention

`{contexte}-{action}-{YYYYMMDD-HHmmss}.png`

Exemples:
- `dashboard-initial-20251228-143022.png`
- `coaching-modal-open-20251228-143045.png`
- `flow-weekly-phase2-20251228-143100.png`

### Où sauvegarder

`tests/reports/screenshots/`

### Quand capturer

- État initial de la page
- Avant action importante
- Après action importante
- En cas d'échec

### Tips

- Attendre fin des animations
- Fermer les toasts avant capture
- S'assurer que les données sont chargées
- Pour les charts: attendre rendu complet

---

## Viewports

| Device | Largeur | Hauteur |
|--------|---------|---------|
| Desktop | 1920px | 1080px |
| Tablet | 1024px | 768px |
| Mobile | 390px | 844px |

---

## Sélecteurs communs

### KPI Cards

- Container: section avec 4 cards en grid
- Chaque card: titre, valeur, badge, trend

### Period Picker

- Bouton avec semaine affichée
- Popover avec calendrier
- Flèches navigation
- Bouton "Aujourd'hui"

### Tables

- Table avec header cliquable (tri)
- Lignes cliquables (navigation)
- Pagination si >10 items

### Modals

- Overlay sombre en backdrop
- Container blanc centré
- Boutons action en footer

---

## Assertions communes

### Page chargée

- [ ] Pas d'écran blanc
- [ ] Titre page visible
- [ ] Pas de skeleton persistant (>10s)
- [ ] Pas d'erreurs console rouges

### Données présentes

- [ ] Au moins 1 élément de données
- [ ] Valeurs numériques valides
- [ ] Pas de "undefined" ou "NaN"

### Interactions

- [ ] Clics répondent
- [ ] Hovers affichent tooltips
- [ ] Navigation fonctionne
- [ ] Forms se soumettent

---

## Gestion des erreurs

### Console errors

- **Rouge (Error)**: Critique, à investiguer
- **Orange (Warning)**: Généralement OK, noter si récurrent
- **Bleu (Info)**: Ignorer

### Erreurs communes

| Message | Cause | Action |
|---------|-------|--------|
| "Not authenticated" | Session expirée | Reconnecter |
| "Failed to fetch" | Network/Convex | Vérifier connection |
| "undefined is not..." | Bug code | Reporter |
| Hydration mismatch | SSR issue | Généralement OK |

---

## Context Window

L'extension Chrome consomme beaucoup de tokens.

### Avant un test

- Vérifier niveau contexte
- Si >50%, faire `/compact`

### Pendant un test

- Un test à la fois
- Éviter loops infinies
- Générer rapport après chaque test

### Après un test

- Rapport sauvegardé = contexte externalisé
- OK de continuer ou compact
