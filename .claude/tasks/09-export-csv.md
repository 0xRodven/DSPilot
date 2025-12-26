# Task 09: Export CSV des données

## Phase
Phase 3 - Features Additionnelles

## Priorité
MOYENNE

## Objectif
Permettre l'export CSV depuis les tables de données

## Scope

### Tables à exporter
1. **Drivers** - Liste complète avec stats
2. **Coaching Actions** - Historique des actions
3. **Import Detail** - Données brutes importées

## Implémentation

### Fonction utilitaire

```typescript
// lib/utils/csv.ts
export function downloadCSV(data: object[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const value = (row as any)[h]
        // Escape quotes and wrap in quotes if contains comma
        const str = String(value ?? "")
        return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str
      }).join(",")
    )
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
```

### Export Drivers

```typescript
const exportDrivers = () => {
  const csvData = drivers.map(d => ({
    "Nom": d.name,
    "Amazon ID": d.amazonId,
    "DWC %": d.dwcPercent.toFixed(1),
    "IADC %": d.iadcPercent.toFixed(1),
    "Tier": d.tier,
    "Jours actifs": d.daysActive,
    "Statut": d.isActive ? "Actif" : "Inactif",
  }))
  downloadCSV(csvData, `drivers-${stationCode}-S${week}`)
}
```

### Export Coaching

```typescript
const exportCoaching = () => {
  const csvData = actions.map(a => ({
    "Driver": a.driverName,
    "Type": a.actionType,
    "Statut": a.status,
    "Raison": a.reason,
    "DWC avant": a.dwcAtAction.toFixed(1),
    "DWC après": a.dwcAfterAction?.toFixed(1) ?? "-",
    "Date création": format(a.createdAt, "dd/MM/yyyy"),
    "Follow-up": a.followUpDate ?? "-",
  }))
  downloadCSV(csvData, `coaching-${stationCode}`)
}
```

### UI - Bouton Export

```tsx
<Button variant="outline" size="sm" onClick={exportDrivers}>
  <Download className="h-4 w-4 mr-2" />
  Export CSV
</Button>
```

## Steps

1. Créer `lib/utils/csv.ts` avec la fonction `downloadCSV`
2. Ajouter bouton export sur la page Drivers
3. Ajouter bouton export sur la page Coaching
4. Ajouter bouton export sur le detail d'import
5. Tester le format CSV (ouvrir dans Excel)

## Acceptance Criteria

- [ ] Export fonctionne sur toutes les tables
- [ ] Nom de fichier contextuel (station, date)
- [ ] Format CSV valide (Excel-compatible)
- [ ] Caractères spéciaux gérés
- [ ] Headers en français
