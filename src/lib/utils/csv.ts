/**
 * Utility functions for CSV export
 */

/**
 * Download data as CSV file
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    console.warn("No data to export")
    return
  }

  const headers = Object.keys(data[0])

  const csvRows = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          const str = value === null || value === undefined ? "" : String(value)
          // Escape quotes and wrap in quotes if contains comma, newline, or quotes
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(",")
    ),
  ]

  const csvContent = "\uFEFF" + csvRows.join("\n") // BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format driver data for CSV export
 */
export function formatDriversForCSV(
  drivers: Array<{
    name: string
    amazonId: string
    dwcPercent: number
    iadcPercent: number
    tier: string
    daysActive: number
  }>,
  stationCode: string,
  week: number,
  year: number
) {
  return drivers.map((d) => ({
    "Nom": d.name,
    "Amazon ID": d.amazonId,
    "DWC %": d.dwcPercent.toFixed(1),
    "IADC %": d.iadcPercent.toFixed(1),
    "Tier": d.tier,
    "Jours actifs": d.daysActive,
    "Station": stationCode,
    "Semaine": `S${week}`,
    "Année": year,
  }))
}

/**
 * Format coaching actions for CSV export
 */
export function formatCoachingForCSV(
  actions: Array<{
    driverName: string
    driverAmazonId: string
    actionType: string
    status: string
    reason: string
    dwcAtAction: number
    dwcAfterAction?: number
    createdAt: string
    followUpDate?: string
  }>,
  stationCode: string
) {
  return actions.map((a) => ({
    "Driver": a.driverName,
    "Amazon ID": a.driverAmazonId,
    "Type": a.actionType,
    "Statut": a.status,
    "Raison": a.reason,
    "DWC avant": a.dwcAtAction.toFixed(1),
    "DWC après": a.dwcAfterAction?.toFixed(1) ?? "-",
    "Date création": a.createdAt,
    "Follow-up": a.followUpDate ?? "-",
    "Station": stationCode,
  }))
}
