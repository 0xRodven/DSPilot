# Task 04: Ajouter la suppression d'import

## Phase
Phase 1 - Finalisation MVP

## Priorité
MOYENNE

## Objectif
Permettre de supprimer un import et ses données associées

## Contexte
La mutation `deleteImport` existe déjà dans `convex/imports.ts`.
Il faut ajouter le bouton dans l'UI et le dialog de confirmation.

## Fichiers à Modifier

- `src/components/import/import-history.tsx`

## Implémentation

### UI - Bouton suppression

Ajouter dans chaque ligne du tableau d'historique:
- Icône Trash au hover
- Dialog de confirmation
- Spinner pendant suppression

### Dialog de confirmation

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon">
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer cet import ?</AlertDialogTitle>
      <AlertDialogDescription>
        Cette action est irréversible. Toutes les données importées
        (stats daily/weekly, drivers) seront supprimées.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground"
      >
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Handler

```tsx
const deleteImport = useMutation(api.imports.deleteImport)

const handleDelete = async (importId: Id<"imports">) => {
  try {
    await deleteImport({ importId })
    toast.success("Import supprimé")
  } catch (error) {
    toast.error("Erreur lors de la suppression")
  }
}
```

## Steps

1. Importer `AlertDialog` de shadcn/ui
2. Ajouter bouton suppression dans chaque ligne
3. Implémenter le dialog de confirmation
4. Appeler la mutation `deleteImport`
5. Afficher toast de feedback
6. Tester la suppression

## Acceptance Criteria

- [ ] Bouton suppression visible dans l'historique
- [ ] Dialog de confirmation avant suppression
- [ ] Message clair sur les conséquences
- [ ] Suppression effective des données
- [ ] Toast de succès
- [ ] Liste rafraîchie après suppression
