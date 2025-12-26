# DSPilot - Tasks

Ce dossier contient les tâches structurées pour le développement de DSPilot.

## Phases

### Phase 1: Finalisation MVP (Priorité HAUTE)
| # | Task | Description | Status |
|---|------|-------------|--------|
| 01 | `01-driver-detail-convex.md` | Connecter page driver detail à Convex | ✅ Terminé |
| 02 | `02-stations-dynamic.md` | Rendre les stations dynamiques | ✅ Terminé |
| 03 | `03-settings-station.md` | Implémenter settings station | À faire |
| 04 | `04-delete-import.md` | Ajouter suppression d'import | À faire |

### Phase 2: Polish UX
| # | Task | Description | Status |
|---|------|-------------|--------|
| 05 | `05-loading-skeletons.md` | Améliorer les loading states | À faire |
| 06 | `06-responsive-mobile.md` | Optimiser responsive mobile | À faire |
| 07 | `07-error-handling.md` | Gestion des erreurs globale | À faire |
| 08 | `08-animations.md` | Ajouter animations subtiles | À faire |

### Phase 3: Features Additionnelles
| # | Task | Description | Status |
|---|------|-------------|--------|
| 09 | `09-export-csv.md` | Export CSV des données | À faire |
| 10 | `10-date-range-picker.md` | Sélecteur de période amélioré | À faire |
| 11 | `11-driver-comparison.md` | Comparaison de drivers | À faire |

### Phase 4: Déploiement
| # | Task | Description | Status |
|---|------|-------------|--------|
| 12 | `12-vercel-deploy.md` | Déploiement Vercel | À faire |
| 13 | `13-monitoring.md` | Monitoring et Analytics | À faire |

---

## Comment utiliser les tâches

### Lancer une tâche avec Claude

```bash
# Pour une tâche simple
/one-shot Lire .claude/tasks/04-delete-import.md et l'implémenter

# Pour une tâche plus complexe
/apex Lire .claude/tasks/01-driver-detail-convex.md et l'implémenter
```

### Structure d'une tâche

Chaque fichier de tâche contient:
- **Phase**: À quelle phase appartient la tâche
- **Priorité**: HAUTE, MOYENNE, BASSE
- **Objectif**: Ce qu'on veut accomplir
- **Contexte**: Informations sur l'état actuel
- **Fichiers à modifier**: Liste des fichiers concernés
- **Steps**: Étapes d'implémentation détaillées
- **Acceptance Criteria**: Checklist de validation

### Ordre recommandé

1. Commencer par les tâches **Phase 1** (MVP)
2. Puis **Phase 2** (UX) pour polir l'expérience
3. **Phase 3** (Features) pour les fonctionnalités bonus
4. **Phase 4** (Deploy) quand tout est prêt

---

## Mise à jour des statuts

Après avoir terminé une tâche, mettre à jour ce README avec le statut:
- À faire
- En cours
- ✅ Terminé

---

## Notes

- Les tâches sont indépendantes sauf indication contraire
- Respecter l'ordre dans chaque phase
- Tester après chaque tâche
- Commit après chaque tâche terminée
