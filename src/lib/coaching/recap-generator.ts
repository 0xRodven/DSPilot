interface DriverWeeklyComparison {
  name: string
  current: {
    deliveries: number
    dwc: number
    iadc: number
  }
  diff: {
    deliveries: number
    dwc: number
    iadc: number
  }
}

function formatDiff(value: number): string {
  if (value > 0) return `+${value}`
  return value.toString()
}

export function generateWhatsAppRecap(driver: DriverWeeklyComparison, week: number): string {
  const lines: string[] = []

  // Header
  lines.push(`*Recap Semaine ${week}* - ${driver.name}`)
  lines.push("")

  // Deliveries
  const deliveriesEmoji = driver.diff.deliveries >= 0 ? "" : ""
  lines.push(`*${driver.current.deliveries} colis* livres (${formatDiff(driver.diff.deliveries)})`)
  lines.push("")

  // DWC
  let dwcEmoji = ""
  if (driver.current.dwc >= 98.5) {
    dwcEmoji = ""
  } else if (driver.current.dwc >= 96) {
    dwcEmoji = ""
  } else if (driver.diff.dwc < -2) {
    dwcEmoji = ""
  } else {
    dwcEmoji = ""
  }
  lines.push(`${dwcEmoji} DWC: *${driver.current.dwc}%* (${formatDiff(driver.diff.dwc)}%)`)

  // IADC (only if not 100%)
  if (driver.current.iadc < 100) {
    const iadcEmoji = driver.diff.iadc >= 0 ? "" : ""
    lines.push(`${iadcEmoji} IADC: *${driver.current.iadc}%* (${formatDiff(driver.diff.iadc)}%)`)
  }

  lines.push("")

  // Personalized message
  lines.push(getPersonalizedMessage(driver))

  return lines.join("\n")
}

function getPersonalizedMessage(driver: DriverWeeklyComparison): string {
  // Excellent week
  if (driver.current.dwc >= 98.5 && driver.current.iadc >= 99) {
    return " Excellente semaine, continue comme ca !"
  }

  // Good progress
  if (driver.diff.dwc > 3) {
    return " Belle progression cette semaine !"
  }

  // Good week
  if (driver.current.dwc >= 96) {
    return " Bonne semaine, reste focus !"
  }

  // Struggling week
  if (driver.diff.dwc < -3) {
    return " Semaine difficile, on en parle ?"
  }

  // Below threshold
  if (driver.current.dwc < 90) {
    return " Attention, il faut remonter rapidement. Besoin d'aide ?"
  }

  // Default
  return " Continue tes efforts !"
}

export function generateAllRecaps(
  drivers: DriverWeeklyComparison[],
  week: number
): { name: string; message: string }[] {
  return drivers.map((driver) => ({
    name: driver.name,
    message: generateWhatsAppRecap(driver, week),
  }))
}
