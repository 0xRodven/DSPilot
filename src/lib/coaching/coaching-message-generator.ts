// Generator for WhatsApp coaching messages by action type

export type ActionType = "discussion" | "warning" | "training" | "suspension"

export interface CoachingActionData {
  driverName: string
  actionType: ActionType
  dwcPercent: number
  reason: string
  followUpDate?: string
  targetCategory?: string
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "A definir"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  } catch {
    return dateStr
  }
}

function getActionEmoji(type: ActionType): string {
  switch (type) {
    case "discussion":
      return ""
    case "warning":
      return ""
    case "training":
      return ""
    case "suspension":
      return ""
  }
}

function getActionTitle(type: ActionType): string {
  switch (type) {
    case "discussion":
      return "Discussion"
    case "warning":
      return "Avertissement"
    case "training":
      return "Formation"
    case "suspension":
      return "Suspension"
  }
}

export function generateCoachingMessage(data: CoachingActionData): string {
  const lines: string[] = []
  const emoji = getActionEmoji(data.actionType)
  const title = getActionTitle(data.actionType)

  switch (data.actionType) {
    case "discussion":
      lines.push(`${emoji} *Coaching - ${title}*`)
      lines.push("")
      lines.push(`Bonjour ${data.driverName},`)
      lines.push("")
      lines.push(`J'aimerais discuter avec toi de tes performances recentes.`)
      lines.push("")
      lines.push(` DWC actuel: *${data.dwcPercent.toFixed(1)}%*`)
      lines.push(` Sujet: ${data.reason}`)
      if (data.targetCategory) {
        lines.push(` Focus: ${data.targetCategory}`)
      }
      lines.push("")
      lines.push(`On peut en parler cette semaine ?`)
      if (data.followUpDate) {
        lines.push(`RDV prevu: ${formatDate(data.followUpDate)}`)
      }
      lines.push("")
      lines.push(`Merci`)
      break

    case "warning":
      lines.push(`${emoji} *Avertissement Officiel*`)
      lines.push("")
      lines.push(`${data.driverName},`)
      lines.push("")
      lines.push(`Ton DWC est a *${data.dwcPercent.toFixed(1)}%* - en dessous du seuil requis.`)
      lines.push("")
      lines.push(` Raison: ${data.reason}`)
      if (data.targetCategory) {
        lines.push(` Categorie concernee: ${data.targetCategory}`)
      }
      lines.push("")
      lines.push(` Prochain point: ${formatDate(data.followUpDate)}`)
      lines.push("")
      lines.push(`Il faut agir rapidement pour eviter l'escalade.`)
      break

    case "training":
      lines.push(`${emoji} *Formation Prevue*`)
      lines.push("")
      lines.push(`Bonjour ${data.driverName},`)
      lines.push("")
      lines.push(`Une formation est prevue pour t'aider a ameliorer tes performances.`)
      lines.push("")
      lines.push(` DWC: *${data.dwcPercent.toFixed(1)}%*`)
      lines.push(` Focus: ${data.reason}`)
      if (data.targetCategory) {
        lines.push(` Categorie: ${data.targetCategory}`)
      }
      lines.push("")
      lines.push(` Date de suivi: ${formatDate(data.followUpDate)}`)
      lines.push("")
      lines.push(`On compte sur toi !`)
      break

    case "suspension":
      lines.push(`${emoji} *Suspension*`)
      lines.push("")
      lines.push(`${data.driverName},`)
      lines.push("")
      lines.push(`Suite aux problemes recurrents (DWC: *${data.dwcPercent.toFixed(1)}%*), une suspension est appliquee.`)
      lines.push("")
      lines.push(` Raison: ${data.reason}`)
      lines.push("")
      lines.push(`Contacte ton manager pour les prochaines etapes.`)
      break
  }

  return lines.join("\n")
}

export function generateQuickMessage(driverName: string, dwcPercent: number): string {
  if (dwcPercent >= 98.5) {
    return ` Bravo ${driverName} ! Ton DWC de *${dwcPercent.toFixed(1)}%* est excellent. Continue comme ca !`
  }

  if (dwcPercent >= 96) {
    return ` Bien joue ${driverName} ! DWC a *${dwcPercent.toFixed(1)}%*. Tu n'es pas loin du Fantastic !`
  }

  if (dwcPercent >= 90) {
    return ` ${driverName}, ton DWC est a *${dwcPercent.toFixed(1)}%*. Il faut remonter pour atteindre le Great !`
  }

  return ` ${driverName}, attention ! Ton DWC est a *${dwcPercent.toFixed(1)}%*. On doit en parler rapidement.`
}
