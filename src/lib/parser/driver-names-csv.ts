/**
 * Parser pour le CSV Amazon "DSP_Associés_Concessions"
 * Extrait le mapping amazonId → nom du livreur
 */

export interface DriverNameMapping {
  amazonId: string
  name: string
}

export interface ParseDriverNamesCsvResult {
  mappings: DriverNameMapping[]
  errors: string[]
}

/**
 * Parse une ligne CSV avec gestion des quotes
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Push last field
  result.push(current.trim())

  return result
}

/**
 * Parse le contenu d'un fichier CSV Amazon pour extraire les noms des livreurs
 *
 * Format attendu:
 * "Semaine","Nom du livreur","ID du livreur",...
 * "2025-51","Massitan Bamba","A1I8GGPCFC4441",...
 */
export function parseDriverNamesCsv(content: string): ParseDriverNamesCsvResult {
  const errors: string[] = []
  const mappings: DriverNameMapping[] = []
  const seenIds = new Set<string>()

  // Remove BOM if present
  let cleanContent = content
  if (content.charCodeAt(0) === 0xFEFF) {
    cleanContent = content.slice(1)
  }

  // Split into lines
  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim())

  if (lines.length < 2) {
    errors.push("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données")
    return { mappings, errors }
  }

  // Parse header to find column indices
  const header = parseCsvLine(lines[0])

  // Normalize headers for comparison
  const normalizedHeaders = header.map((h) =>
    h.toLowerCase()
      .replace(/[""]/g, "")
      .trim()
  )

  // Find column indices
  const nameIndex = normalizedHeaders.findIndex((h) =>
    h.includes("nom du livreur") || h === "nom" || h.includes("driver name")
  )
  const idIndex = normalizedHeaders.findIndex((h) =>
    h.includes("id du livreur") || h === "id" || h.includes("transporter") || h.includes("driver id")
  )

  if (nameIndex === -1) {
    errors.push(`Colonne "Nom du livreur" non trouvée. Colonnes détectées: ${header.join(", ")}`)
    return { mappings, errors }
  }

  if (idIndex === -1) {
    errors.push(`Colonne "ID du livreur" non trouvée. Colonnes détectées: ${header.join(", ")}`)
    return { mappings, errors }
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)

    const amazonId = fields[idIndex]?.replace(/[""]/g, "").trim()
    const name = fields[nameIndex]?.replace(/[""]/g, "").trim()

    // Validate
    if (!amazonId) {
      errors.push(`Ligne ${i + 1}: ID du livreur manquant`)
      continue
    }

    if (!name) {
      errors.push(`Ligne ${i + 1}: Nom du livreur manquant pour ${amazonId}`)
      continue
    }

    // Skip duplicates (keep last occurrence)
    if (seenIds.has(amazonId)) {
      // Update existing mapping
      const existingIndex = mappings.findIndex((m) => m.amazonId === amazonId)
      if (existingIndex !== -1) {
        mappings[existingIndex].name = name
      }
    } else {
      seenIds.add(amazonId)
      mappings.push({ amazonId, name })
    }
  }

  return { mappings, errors }
}

/**
 * Parse un fichier CSV
 */
export async function parseDriverNamesCsvFile(file: File): Promise<ParseDriverNamesCsvResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const result = parseDriverNamesCsv(content)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"))
    }

    reader.readAsText(file, "utf-8")
  })
}
