# Test Full - Couverture Complète DSPilot

Test exhaustif de toutes les pages et fonctionnalités.

## Durée estimée: 20-30 minutes

## Prérequis

- `npm run dev` actif sur localhost:3005
- Utilisateur authentifié dans Chrome
- Données de test présentes (imports effectués)

## Arguments

$ARGUMENTS

## Instructions

Exécuter le test en **6 phases**. Après chaque phase, sauvegarder un rapport intermédiaire pour ne pas perdre le travail en cas de timeout.

---

### Phase 1: Auth & Navigation (3 min)

**Objectif**: Vérifier que l'app fonctionne et que la navigation est OK.

**Étapes**:
1. Naviguer vers http://localhost:3005
2. Vérifier pas d'écran blanc
3. Vérifier avatar utilisateur visible
4. Ouvrir console DevTools → noter erreurs
5. Cliquer chaque lien sidebar:
   - Dashboard
   - Drivers
   - Erreurs
   - Import
   - Coaching
   - Settings (si présent)
6. Vérifier que chaque page charge

**Sauvegarder**: `tests/reports/full/phase1-auth.md`

```markdown
# Phase 1: Auth & Navigation

## Résultat: PASS/FAIL

## Vérifications
- [ ] App charge: OK/FAIL
- [ ] Auth visible: OK/FAIL
- [ ] Console propre: OK/FAIL (X erreurs)
- [ ] Dashboard: OK/FAIL
- [ ] Drivers: OK/FAIL
- [ ] Erreurs: OK/FAIL
- [ ] Import: OK/FAIL
- [ ] Coaching: OK/FAIL
- [ ] Settings: OK/FAIL

## Erreurs détectées
...
```

---

### Phase 2: Dashboard Complet (5 min)

**Objectif**: Tester tous les éléments du dashboard.

**Étapes**:
1. Aller /dashboard
2. Vérifier 4 KPI cards (DWC, IADC, Drivers, Alertes)
3. Vérifier couleurs tier correctes
4. Tester Period Picker:
   - Clic ouvre
   - Flèche gauche → semaine -1
   - Vérifier données changent
   - Bouton "Aujourd'hui" → retour
5. Vérifier Tier Distribution (graphique barres)
6. Vérifier Top 5 Drivers
7. Vérifier Top 5 Erreurs
8. Tester Table Drivers:
   - Tri par DWC
   - Tri par nom
   - Recherche
   - Clic ligne (ne pas naviguer, juste vérifier)

**Sauvegarder**: `tests/reports/full/phase2-dashboard.md`

---

### Phase 3: Drivers & Detail (5 min)

**Objectif**: Tester liste drivers et page détail.

**Étapes**:
1. Aller /dashboard/drivers
2. Vérifier 4 cards stats tier (Fantastic, Great, Fair, Poor)
3. Vérifier totaux cohérents
4. Clic card "Poor" → filtre table
5. Vérifier seuls drivers Poor affichés
6. Clic card "Tous" ou reset
7. Recherche un nom
8. Clic sur un driver → page détail
9. Sur page détail:
   - Header nom + tier
   - KPIs individuels
   - Graphique historique
   - Breakdown erreurs
   - Historique coaching
10. Bouton retour → liste drivers

**Sauvegarder**: `tests/reports/full/phase3-drivers.md`

---

### Phase 4: Import & Coaching (5 min)

**Objectif**: Tester import et système coaching.

**Étapes Import**:
1. Aller /dashboard/import
2. Vérifier dropzone visible
3. Vérifier instructions formats
4. Vérifier historique imports

**Étapes Coaching**:
5. Aller /dashboard/coaching
6. Vérifier Kanban 4 colonnes
7. Compter cards par colonne
8. Cliquer "+ Nouvelle action"
9. Vérifier modal:
   - Select driver fonctionne
   - Select type (4 options)
   - Champ raison
   - Boutons Créer/Annuler
10. Annuler (ne pas créer)
11. Si cards existantes: cliquer une pour voir modal évaluation

**Sauvegarder**: `tests/reports/full/phase4-import-coaching.md`

---

### Phase 5: Errors & Settings (3 min)

**Objectif**: Tester pages secondaires.

**Étapes Errors**:
1. Aller /dashboard/errors
2. Vérifier tabs DWC/IADC/False Scans
3. Cliquer chaque tab
4. Vérifier liste erreurs par type
5. Vérifier counts

**Étapes Settings**:
6. Aller /dashboard/settings
7. Vérifier section compte
8. Vérifier section station
9. Vérifier infos correctes

**Sauvegarder**: `tests/reports/full/phase5-errors-settings.md`

---

### Phase 6: Cross-Page & Final (5 min)

**Objectif**: Vérifier intégration et générer rapport final.

**Étapes Cross-Page**:
1. Dashboard → cliquer driver dans table → page détail charge
2. Page détail → retour → Dashboard
3. Dashboard → cliquer erreur → page Errors
4. Drivers → cliquer driver → détail → retour → liste

**Étapes Responsive**:
5. Réduire fenêtre à taille mobile (390px)
6. Vérifier sidebar collapse
7. Vérifier tables s'adaptent
8. Revenir desktop

**Étapes Console Final**:
9. Ouvrir console
10. Noter toutes erreurs accumulées
11. Vérifier network (pas d'erreurs 4xx/5xx)

**Sauvegarder**: `tests/reports/full/phase6-final.md`

---

## Génération Rapport Final

Après les 6 phases, lire tous les rapports intermédiaires et générer:

**Fichier**: `tests/reports/full-test-{YYYY-MM-DD}.md`

```markdown
# Test Complet DSPilot - {date}

## Score Global: X/85 tests passés (Y%)

## Résultat: PASS / FAIL

## Résumé par Phase

| Phase | Description | Résultat | Issues |
|-------|-------------|----------|--------|
| 1 | Auth & Navigation | PASS/FAIL | X |
| 2 | Dashboard | PASS/FAIL | X |
| 3 | Drivers & Detail | PASS/FAIL | X |
| 4 | Import & Coaching | PASS/FAIL | X |
| 5 | Errors & Settings | PASS/FAIL | X |
| 6 | Cross-Page & Final | PASS/FAIL | X |

## Bugs Détectés

### Critiques (bloquants)
1. ...

### Majeurs (fonctionnalité impactée)
1. ...

### Mineurs (cosmétiques)
1. ...

## Console Errors
...

## Screenshots Problèmes
- [Description](./screenshots/...)

## Checklist Complète

Lire: tests/cases/full/checklist.md
Cocher chaque item vérifié.

## Recommandations
1. ...
2. ...

## Environnement
- URL: http://localhost:3005
- Date: {date}
- Durée: Xm
- Station: {code}
```

---

## Tips

1. **Si timeout Chrome**: Les rapports intermédiaires permettent de reprendre
2. **Si contexte plein**: Faire /compact entre les phases
3. **Si erreur auth**: Se reconnecter dans Chrome puis continuer
4. **Screenshots**: Capturer les bugs visuels pour le rapport

## Contexte

Lire: `tests/cases/full/checklist.md` pour la liste exhaustive des 85 items à vérifier.
