// Status utilities for coaching and imports

// Coaching statuses
export type CoachingStatus = "pending" | "improved" | "no_effect" | "escalated"
export type CoachingActionType = "discussion" | "warning" | "training" | "suspension"

export const getCoachingStatusColor = (status: CoachingStatus) => {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    case "improved":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "no_effect":
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
    case "escalated":
      return "bg-red-500/20 text-red-400 border-red-500/30"
  }
}

export const getCoachingStatusLabel = (status: CoachingStatus) => {
  switch (status) {
    case "pending":
      return "En attente"
    case "improved":
      return "Amélioré"
    case "no_effect":
      return "Sans effet"
    case "escalated":
      return "Escaladé"
  }
}

export const getActionTypeIcon = (type: CoachingActionType) => {
  switch (type) {
    case "discussion":
      return "MessageSquare"
    case "warning":
      return "AlertTriangle"
    case "training":
      return "BookOpen"
    case "suspension":
      return "Ban"
  }
}

export const getActionTypeLabel = (type: CoachingActionType) => {
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

export const getActionTypeColor = (type: CoachingActionType) => {
  switch (type) {
    case "discussion":
      return "text-blue-400 bg-blue-500/20"
    case "warning":
      return "text-amber-400 bg-amber-500/20"
    case "training":
      return "text-emerald-400 bg-emerald-500/20"
    case "suspension":
      return "text-red-400 bg-red-500/20"
  }
}

// Import statuses
export type ImportStatus = "success" | "partial" | "failed"

export const getImportStatusColor = (status: ImportStatus) => {
  switch (status) {
    case "success":
      return "bg-emerald-500/20 text-emerald-400"
    case "partial":
      return "bg-amber-500/20 text-amber-400"
    case "failed":
      return "bg-red-500/20 text-red-400"
  }
}

export const getImportStatusLabel = (status: ImportStatus) => {
  switch (status) {
    case "success":
      return "Succès"
    case "partial":
      return "Partiel"
    case "failed":
      return "Échec"
  }
}
