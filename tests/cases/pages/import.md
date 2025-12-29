# Test: Import

Test de la page d'import de données.

## Prérequis

- Utilisateur authentifié
- Fichier test disponible (HTML DWC ou CSV)

## URL

`/dashboard/import`

## Tests

### T1: Affichage initial

**Étapes**:
1. Naviguer vers la page import
2. Observer l'interface

**Assertions**:
- [ ] Titre page visible ("Import" ou "Importer")
- [ ] Zone de drop visible (dropzone)
- [ ] Instructions visibles (formats acceptés)
- [ ] Historique imports visible (si existant)

---

### T2: Dropzone

**Étapes**:
1. Observer la zone de drop

**Assertions**:
- [ ] Zone clairement délimitée
- [ ] Icône upload visible
- [ ] Texte instruction ("Glisser-déposer" ou "Cliquer")
- [ ] Formats acceptés indiqués (HTML, CSV)

---

### T3: Historique imports

**Étapes**:
1. Localiser section historique

**Assertions**:
- [ ] Liste des imports passés (si existants)
- [ ] Chaque entrée: date, semaine, statut, count
- [ ] Statuts colorés (success: vert, failed: rouge)

---

### T4: Feedback visuel (drag)

**Étapes**:
1. Simuler drag d'un fichier sur la zone

**Assertions**:
- [ ] Zone change d'apparence (bordure, couleur)
- [ ] Indication visuelle d'acceptation

**Note**: Ce test nécessite interaction drag réelle

---

### T5: Upload fichier (optionnel)

**Si fichier test disponible**:

**Étapes**:
1. Uploader fichier HTML DWC test
2. Observer le process

**Assertions**:
- [ ] Progress indicator visible
- [ ] Preview des données avant confirmation
- [ ] Bouton confirmer/annuler
- [ ] Après confirm: toast success
- [ ] Historique mis à jour

---

### T6: Gestion erreurs

**Étapes**:
1. Tenter upload fichier invalide (si possible)

**Assertions**:
- [ ] Message erreur clair
- [ ] Toast ou alert visible
- [ ] Pas de crash app

---

## Durée estimée

2-3 minutes (sans upload réel)

## Rapport

```markdown
# Test Import - {date}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: Affichage | OK/FAIL | |
| T2: Dropzone | OK/FAIL | |
| T3: Historique | OK/FAIL | |
| T4: Drag feedback | OK/FAIL/SKIP | |
| T5: Upload | OK/FAIL/SKIP | |
| T6: Erreurs | OK/FAIL/SKIP | |

## Screenshots
- [Page import](./screenshots/import-initial.png)
- [Historique](./screenshots/import-history.png)
```
