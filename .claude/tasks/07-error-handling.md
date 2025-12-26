# Task 07: Gestion des erreurs globale

## Phase
Phase 2 - Polish UX

## Priorité
HAUTE

## Objectif
Ajouter des toast notifications pour toutes les erreurs et succès

## Contexte
Sonner est déjà installé et configuré dans le layout.
Besoin d'ajouter les toasts de manière systématique.

## Cas à Couvrir

### Mutations avec succès
- Import confirmé
- Action coaching créée
- Action évaluée
- Settings sauvegardés
- Import supprimé

### Mutations avec erreur
- Erreur réseau
- Validation échouée
- Erreur serveur Convex
- Authentification expirée

### Erreurs spécifiques
- Fichier HTML invalide (import)
- Code station déjà utilisé
- Driver non trouvé

## Implémentation

### Wrapper pour mutations

```tsx
// lib/utils/mutation.ts
import { toast } from "sonner"

export async function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading?: string
    success?: string
    error?: string | ((err: Error) => string)
  }
): Promise<T | null> {
  const { loading, success, error } = messages

  if (loading) {
    toast.loading(loading)
  }

  try {
    const result = await promise
    toast.dismiss()
    if (success) {
      toast.success(success)
    }
    return result
  } catch (err) {
    toast.dismiss()
    const message = typeof error === "function"
      ? error(err as Error)
      : error || (err as Error).message
    toast.error(message)
    return null
  }
}
```

### Usage

```tsx
const handleCreate = async () => {
  await withToast(
    createAction({
      driverId,
      actionType: form.type,
      reason: form.reason,
    }),
    {
      loading: "Création en cours...",
      success: "Action créée avec succès",
      error: "Erreur lors de la création"
    }
  )
}
```

### Toast styles

```tsx
// Déjà configuré dans layout.tsx
<Toaster
  position="bottom-right"
  richColors
  closeButton
/>
```

## Steps

1. Créer helper `withToast` dans `lib/utils/`
2. Identifier toutes les mutations dans l'app
3. Wrapper chaque mutation avec `withToast`
4. Ajouter messages contextuels
5. Tester les cas d'erreur

## Acceptance Criteria

- [ ] Toast sur chaque mutation
- [ ] Messages clairs et contextuels
- [ ] Toast success vert
- [ ] Toast error rouge
- [ ] Loading state si opération longue
- [ ] Erreurs réseau gérées
