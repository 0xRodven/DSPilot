# Test: Settings

Test de la page paramètres.

## Prérequis

- Utilisateur authentifié

## URL

`/dashboard/settings`

---

## Tests

### T1: Affichage Initial

**Étapes**:
1. Naviguer vers /dashboard/settings
2. Attendre chargement

**Assertions**:
- [ ] Page charge sans erreur
- [ ] Titre visible ("Paramètres" ou "Settings")
- [ ] Sections visibles

---

### T2: Section Compte Utilisateur

**Étapes**:
1. Localiser section compte/profil

**Assertions**:
- [ ] Section visible
- [ ] Nom utilisateur affiché
- [ ] Email affiché
- [ ] Avatar/photo (si disponible)
- [ ] Lien "Gérer compte" vers Clerk (si disponible)

---

### T3: Section Station

**Étapes**:
1. Localiser section station

**Assertions**:
- [ ] Section visible
- [ ] Nom station affiché
- [ ] Code station affiché (ex: DIF1)
- [ ] Région (si disponible)
- [ ] Possibilité de modifier (si implémenté)

---

### T4: Section Abonnement (si présent)

**Étapes**:
1. Chercher section abonnement/plan

**Assertions**:
- [ ] Plan actuel affiché (Free/Pro/Enterprise)
- [ ] Date renouvellement (si applicable)
- [ ] Lien upgrade (si disponible)

---

### T5: Section Préférences (si présent)

**Étapes**:
1. Chercher préférences utilisateur

**Assertions**:
- [ ] Thème (clair/sombre) - si disponible
- [ ] Langue - si disponible
- [ ] Notifications - si disponible

---

### T6: Actions

**Étapes**:
1. Observer les boutons d'action

**Assertions**:
- [ ] Bouton sauvegarder (si formulaire éditable)
- [ ] Bouton déconnexion (optionnel)
- [ ] Feedback après action (toast)

---

### T7: Validation Formulaire (si éditable)

**Étapes**:
1. Si champs éditables, tester validation

**Assertions**:
- [ ] Champs requis marqués
- [ ] Erreurs affichées si invalide
- [ ] Sauvegarde fonctionne

---

### T8: Responsive

**Étapes**:
1. Réduire viewport à mobile

**Assertions**:
- [ ] Layout s'adapte
- [ ] Sections empilées verticalement
- [ ] Formulaires utilisables

---

## Durée estimée

2 minutes

## Rapport

```markdown
# Test Settings - {date}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: Affichage | OK/FAIL | |
| T2: Section compte | OK/FAIL | |
| T3: Section station | OK/FAIL | |
| T4: Abonnement | OK/FAIL/N/A | |
| T5: Préférences | OK/FAIL/N/A | |
| T6: Actions | OK/FAIL | |
| T7: Validation | OK/FAIL/N/A | |
| T8: Responsive | OK/FAIL | |

## Infos affichées

| Champ | Valeur |
|-------|--------|
| Nom | ... |
| Email | ... |
| Station | ... |
| Code | ... |
| Plan | ... |

## Screenshot
![Settings](./screenshots/settings.png)
```
