import { Agent, createTool } from "@convex-dev/agent"
import { components, api } from "./_generated/api"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { Id } from "./_generated/dataModel"

// Types for dashboard data
interface DashboardDriver {
  id: Id<"drivers">
  name: string
  amazonId: string
  dwcPercent: number
  iadcPercent: number
  daysActive: number
  tier: "fantastic" | "great" | "fair" | "poor"
  trend: number | null
}

interface ErrorCategory {
  id: "dwc" | "iadc" | "false-scans"
  name: string
  total: number
  trend: number
  trendPercent: number
  subcategories: Array<{
    name: string
    count: number
    percentage: number
    trend: number
  }>
}

interface TopDriverError {
  id: Id<"drivers">
  name: string
  totalErrors: number
  tier: "fantastic" | "great" | "fair" | "poor"
  dwcPercent: number
  mainError: string
  mainErrorCount: number
  percentage: number
}

// For getTrend tool
interface EvolutionDataPoint {
  week: string
  weekNumber: number
  year: number
  dwc: number
  iadc: number
  activeDrivers: number
}

// For suggestCoaching tool
interface CoachingSuggestion {
  id: string
  driverId: Id<"drivers">
  driverName: string
  driverTier: "fantastic" | "great" | "fair" | "poor"
  driverDwc: number
  priority: "high" | "negative_trend" | "relapse" | "new_poor"
  reason: string
  mainError: string
  mainErrorCount: number
  hasActiveAction: boolean
}

/**
 * DSPilot Super Agent
 *
 * Agent autonome et surpuissant capable de:
 * - Interroger n'importe quelle semaine/période
 * - Chercher des livreurs par nom
 * - Comparer des périodes
 * - Analyser les erreurs
 * - Fonctionner indépendamment du dashboard
 */

// ============================================
// TOOL DEFINITIONS - 7 POWERFUL TOOLS
// ============================================

/**
 * Tool 1: Get current date and week info
 */
const getCurrentDate = createTool({
  description:
    "Obtient la date actuelle et le numéro de semaine. Utilise ce tool UNIQUEMENT quand l'utilisateur dit 'cette semaine', 'aujourd'hui', ou 'actuellement'.",
  args: z.object({}),
  handler: async (): Promise<string> => {
    const now = new Date()
    const { week, year } = getISOWeekAndYear(now)
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    const day = dayNames[now.getDay()]

    return `Aujourd'hui: ${day} ${now.toLocaleDateString("fr-FR")}
Semaine actuelle: ${week}
Année: ${year}`
  },
})

/**
 * Tool 2: Get station KPIs for a specific week
 */
const getStationKPIs = createTool({
  description:
    "Récupère les KPIs d'une station pour une semaine spécifique: DWC%, IADC%, trends, alertes, distribution des tiers. Utilise getCurrentDate d'abord si l'utilisateur demande 'cette semaine'.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station (fourni dans le contexte)"),
    year: z.number().describe("L'année (ex: 2025)"),
    week: z.number().describe("Le numéro de semaine (1-52)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const result = await ctx.runQuery(api.stats.getDashboardKPIs, {
        stationId: args.stationId as Id<"stations">,
        year: args.year,
        week: args.week,
      })

      if (!result) {
        return `Aucune donnée trouvée pour la semaine ${args.week}/${args.year}. La station n'a peut-être pas encore de données importées pour cette période.`
      }

      const tierEmoji = {
        fantastic: "🟢",
        great: "🔵",
        fair: "🟡",
        poor: "🔴",
      }

      return `📊 KPIs Station - Semaine ${args.week}/${args.year}

DWC: ${result.avgDwc}% ${result.dwcTrend >= 0 ? "↗️" : "↘️"} (${result.dwcTrend > 0 ? "+" : ""}${result.dwcTrend}% vs S${result.prevWeek})
IADC: ${result.avgIadc}% ${result.iadcTrend >= 0 ? "↗️" : "↘️"} (${result.iadcTrend > 0 ? "+" : ""}${result.iadcTrend}% vs S${result.prevWeek})

Livreurs: ${result.activeDrivers} actifs
Alertes: ${result.alerts} livreur(s) sous 90% DWC

Distribution des tiers:
${tierEmoji.fantastic} Fantastic (≥98.5%): ${result.tierDistribution.fantastic}
${tierEmoji.great} Great (≥96%): ${result.tierDistribution.great}
${tierEmoji.fair} Fair (≥90%): ${result.tierDistribution.fair}
${tierEmoji.poor} Poor (<90%): ${result.tierDistribution.poor}`
    } catch (error) {
      return `Erreur lors de la récupération des KPIs: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 3: Get driver performance by name
 */
const getDriverPerformance = createTool({
  description:
    "Recherche un livreur par son nom et retourne ses performances. Peut chercher sur une semaine spécifique ou la plus récente.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    driverName: z.string().describe("Le nom du livreur à rechercher (partiel accepté)"),
    year: z.number().optional().describe("L'année (optionnel, défaut: actuelle)"),
    week: z.number().optional().describe("La semaine (optionnel, défaut: actuelle)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Search for the driver
      const drivers = await ctx.runQuery(api.drivers.searchDriversByName, {
        stationId: args.stationId as Id<"stations">,
        name: args.driverName,
        limit: 5,
      })

      if (drivers.length === 0) {
        return `Aucun livreur trouvé avec le nom "${args.driverName}". Vérifiez l'orthographe ou essayez avec moins de caractères.`
      }

      // Determine year/week
      const now = new Date()
      const year = args.year || now.getFullYear()
      const week = args.week || getWeekNumber(now)

      // Get stats for matched drivers
      const dashboardDrivers = await ctx.runQuery(api.stats.getDashboardDrivers, {
        stationId: args.stationId as Id<"stations">,
        year,
        week,
      }) as DashboardDriver[]

      // Find the matching driver in dashboard stats
      const results: string[] = []

      for (const driver of drivers) {
        const stats = dashboardDrivers.find((d: DashboardDriver) => d.id === driver._id)

        if (stats) {
          const tierEmoji =
            stats.tier === "fantastic"
              ? "🟢"
              : stats.tier === "great"
                ? "🔵"
                : stats.tier === "fair"
                  ? "🟡"
                  : "🔴"

          const trendArrow = stats.trend !== null ? (stats.trend >= 0 ? "↗️" : "↘️") : ""
          const trendText =
            stats.trend !== null ? `(${stats.trend > 0 ? "+" : ""}${stats.trend}%)` : ""

          results.push(`👤 ${driver.name} (${driver.amazonId})
${tierEmoji} Tier: ${stats.tier.toUpperCase()}
📈 DWC: ${stats.dwcPercent}% ${trendArrow} ${trendText}
📊 IADC: ${stats.iadcPercent}%
📅 Jours actifs: ${stats.daysActive}`)
        } else {
          results.push(`👤 ${driver.name} (${driver.amazonId})
⚠️ Pas de données pour la semaine ${week}/${year}`)
        }
      }

      return `Résultats pour "${args.driverName}" - Semaine ${week}/${year}:

${results.join("\n\n")}`
    } catch (error) {
      return `Erreur lors de la recherche: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 4: List drivers with filters
 */
const listDrivers = createTool({
  description:
    "Liste les livreurs d'une station avec filtres. Peut lister tous, les sous-performants (<90% DWC), les top performers, ou ceux en alerte.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    year: z.number().describe("L'année"),
    week: z.number().describe("La semaine"),
    filter: z
      .enum(["all", "underperforming", "top", "alerts"])
      .describe(
        "Filtre: 'all'=tous, 'underperforming'=DWC<90%, 'top'=Fantastic, 'alerts'=nécessitent attention"
      ),
    limit: z.number().optional().describe("Nombre max de résultats (défaut: 10)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const limit = args.limit || 10

      const allDrivers = await ctx.runQuery(api.stats.getDashboardDrivers, {
        stationId: args.stationId as Id<"stations">,
        year: args.year,
        week: args.week,
      }) as DashboardDriver[]

      if (allDrivers.length === 0) {
        return `Aucun livreur trouvé pour la semaine ${args.week}/${args.year}.`
      }

      // Apply filter
      let filtered: DashboardDriver[] = allDrivers
      let filterLabel = "Tous les livreurs"

      switch (args.filter) {
        case "underperforming":
          filtered = allDrivers.filter((d: DashboardDriver) => d.dwcPercent < 90)
          filterLabel = "Livreurs sous-performants (<90% DWC)"
          break
        case "top":
          filtered = allDrivers.filter((d: DashboardDriver) => d.tier === "fantastic")
          filterLabel = "Top performers (Fantastic)"
          break
        case "alerts":
          filtered = allDrivers.filter((d: DashboardDriver) => d.tier === "poor" || (d.trend !== null && d.trend < -3))
          filterLabel = "Livreurs nécessitant attention"
          break
      }

      // Sort by DWC descending for top, ascending for others
      if (args.filter === "top") {
        filtered.sort((a: DashboardDriver, b: DashboardDriver) => b.dwcPercent - a.dwcPercent)
      } else {
        filtered.sort((a: DashboardDriver, b: DashboardDriver) => a.dwcPercent - b.dwcPercent)
      }

      // Limit results
      filtered = filtered.slice(0, limit)

      if (filtered.length === 0) {
        return `${filterLabel}: Aucun livreur ne correspond à ce critère pour la semaine ${args.week}/${args.year}.`
      }

      const tierEmoji: Record<string, string> = {
        fantastic: "🟢",
        great: "🔵",
        fair: "🟡",
        poor: "🔴",
      }

      const driverLines = filtered.map((d: DashboardDriver, i: number) => {
        const trendArrow = d.trend !== null ? (d.trend >= 0 ? "↗️" : "↘️") : ""
        return `${i + 1}. ${tierEmoji[d.tier]} ${d.name} - DWC: ${d.dwcPercent}% ${trendArrow}`
      })

      return `📋 ${filterLabel} - Semaine ${args.week}/${args.year}
(${filtered.length}/${allDrivers.length} livreurs)

${driverLines.join("\n")}`
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 5: Compare two weeks
 */
const compareWeeks = createTool({
  description: "Compare les KPIs de deux semaines différentes pour voir l'évolution.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    year1: z.number().describe("Année de la première semaine"),
    week1: z.number().describe("Numéro de la première semaine"),
    year2: z.number().describe("Année de la deuxième semaine"),
    week2: z.number().describe("Numéro de la deuxième semaine"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const [kpis1, kpis2] = await Promise.all([
        ctx.runQuery(api.stats.getDashboardKPIs, {
          stationId: args.stationId as Id<"stations">,
          year: args.year1,
          week: args.week1,
        }),
        ctx.runQuery(api.stats.getDashboardKPIs, {
          stationId: args.stationId as Id<"stations">,
          year: args.year2,
          week: args.week2,
        }),
      ])

      if (!kpis1 || !kpis2) {
        const missing = []
        if (!kpis1) missing.push(`S${args.week1}/${args.year1}`)
        if (!kpis2) missing.push(`S${args.week2}/${args.year2}`)
        return `Données manquantes pour: ${missing.join(", ")}`
      }

      const dwcDiff = Math.round((kpis2.avgDwc - kpis1.avgDwc) * 10) / 10
      const iadcDiff = Math.round((kpis2.avgIadc - kpis1.avgIadc) * 10) / 10
      const alertsDiff = kpis2.alerts - kpis1.alerts

      const dwcArrow = dwcDiff >= 0 ? "↗️" : "↘️"
      const iadcArrow = iadcDiff >= 0 ? "↗️" : "↘️"
      const alertsArrow = alertsDiff <= 0 ? "✅" : "⚠️"

      return `📊 Comparaison S${args.week1}/${args.year1} vs S${args.week2}/${args.year2}

DWC:
  S${args.week1}: ${kpis1.avgDwc}%
  S${args.week2}: ${kpis2.avgDwc}%
  ${dwcArrow} Diff: ${dwcDiff > 0 ? "+" : ""}${dwcDiff}%

IADC:
  S${args.week1}: ${kpis1.avgIadc}%
  S${args.week2}: ${kpis2.avgIadc}%
  ${iadcArrow} Diff: ${iadcDiff > 0 ? "+" : ""}${iadcDiff}%

Alertes:
  S${args.week1}: ${kpis1.alerts}
  S${args.week2}: ${kpis2.alerts}
  ${alertsArrow} Diff: ${alertsDiff > 0 ? "+" : ""}${alertsDiff}

Livreurs actifs:
  S${args.week1}: ${kpis1.activeDrivers}
  S${args.week2}: ${kpis2.activeDrivers}`
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 6: Get error breakdown
 */
const getErrorBreakdown = createTool({
  description:
    "Analyse détaillée des erreurs DWC et IADC pour une semaine: Contact Miss, Photo Defect, No Photo, etc.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    year: z.number().describe("L'année"),
    week: z.number().describe("La semaine"),
    category: z
      .enum(["dwc", "iadc", "all"])
      .optional()
      .describe("Catégorie d'erreurs (défaut: all)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const errors = await ctx.runQuery(api.stats.getErrorBreakdown, {
        stationId: args.stationId as Id<"stations">,
        year: args.year,
        week: args.week,
      }) as ErrorCategory[]

      if (!errors || errors.length === 0) {
        return `Aucune donnée d'erreurs pour la semaine ${args.week}/${args.year}.`
      }

      const category = args.category || "all"
      const filtered = category === "all" ? errors : errors.filter((e: ErrorCategory) => e.id === category)

      const sections = filtered.map((cat: ErrorCategory) => {
        const trendArrow = cat.trend <= 0 ? "✅" : "⚠️"
        const subcatLines = cat.subcategories
          .filter((s: { count: number }) => s.count > 0)
          .map((s: { name: string; count: number; percentage: number; trend: number }) => {
            const subTrendArrow = s.trend <= 0 ? "↘️" : "↗️"
            return `  • ${s.name}: ${s.count} (${s.percentage}%) ${subTrendArrow}`
          })

        return `📌 ${cat.name}
Total: ${cat.total} erreurs ${trendArrow} (${cat.trend > 0 ? "+" : ""}${cat.trend} vs semaine précédente)
${subcatLines.join("\n")}`
      })

      return `🔍 Analyse des erreurs - Semaine ${args.week}/${args.year}

${sections.join("\n\n")}`
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 7: Get top drivers with errors
 */
const getTopDriversWithErrors = createTool({
  description:
    "Liste les livreurs avec le plus d'erreurs pour une semaine. Utile pour identifier qui coacher.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    year: z.number().describe("L'année"),
    week: z.number().describe("La semaine"),
    limit: z.number().optional().describe("Nombre max de résultats (défaut: 10)"),
    errorType: z
      .string()
      .optional()
      .describe("Type d'erreur spécifique (ex: contact-miss, photo-defect)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const topDrivers = await ctx.runQuery(api.stats.getTopDriversErrors, {
        stationId: args.stationId as Id<"stations">,
        year: args.year,
        week: args.week,
        limit: args.limit || 10,
        errorTypeFilter: args.errorType || "all",
      }) as TopDriverError[]

      if (!topDrivers || topDrivers.length === 0) {
        return `Aucun livreur avec des erreurs pour la semaine ${args.week}/${args.year}.`
      }

      const tierEmoji: Record<string, string> = {
        fantastic: "🟢",
        great: "🔵",
        fair: "🟡",
        poor: "🔴",
      }

      const lines = topDrivers.map((d: TopDriverError, i: number) => {
        return `${i + 1}. ${tierEmoji[d.tier]} ${d.name}
   Erreurs: ${d.totalErrors} (${d.percentage}% du total)
   Type principal: ${d.mainError} (${d.mainErrorCount})
   DWC: ${d.dwcPercent}%`
      })

      const filterLabel = args.errorType ? ` - Filtre: ${args.errorType}` : ""

      return `⚠️ Top livreurs avec erreurs - Semaine ${args.week}/${args.year}${filterLabel}

${lines.join("\n\n")}`
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 8: Get performance trend over multiple weeks
 */
const getTrend = createTool({
  description:
    "Montre l'évolution du DWC et IADC sur plusieurs semaines avec un graphique ASCII. Utile pour voir les tendances de la station.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    metric: z.enum(["dwc", "iadc", "both"]).default("dwc").describe("Métrique à afficher"),
    weeks: z.number().min(2).max(12).default(4).describe("Nombre de semaines (2-12)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const evolution = await ctx.runQuery(api.stats.getPerformanceEvolution, {
        stationId: args.stationId as Id<"stations">,
        weeksCount: args.weeks,
      }) as EvolutionDataPoint[]

      if (!evolution || evolution.length === 0) {
        return "Pas assez de données historiques pour afficher la tendance."
      }

      // Format ASCII chart (sparkline style)
      const formatSparkline = (values: number[], label: string): string => {
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1
        const chars = "▁▂▃▄▅▆▇█"

        const sparkline = values.map(v => {
          const idx = Math.floor(((v - min) / range) * (chars.length - 1))
          return chars[idx]
        }).join("")

        const trend = values[values.length - 1] - values[0]
        const trendArrow = trend >= 0 ? "↗️" : "↘️"

        return `${label}: ${sparkline} ${trendArrow} (${trend > 0 ? "+" : ""}${trend.toFixed(1)}%)`
      }

      const dwcValues = evolution.map(e => e.dwc)
      const iadcValues = evolution.map(e => e.iadc)

      let result = `📈 **Évolution sur ${evolution.length} semaines**\n\n`

      // Week labels
      const weekLabels = evolution.map(e => `S${e.weekNumber}`).join(" ")
      result += `Semaines: ${weekLabels}\n\n`

      if (args.metric === "dwc" || args.metric === "both") {
        result += formatSparkline(dwcValues, "DWC") + "\n"
        result += `  ${dwcValues.map(v => v.toFixed(0).padStart(3)).join(" ")}%\n\n`
      }

      if (args.metric === "iadc" || args.metric === "both") {
        result += formatSparkline(iadcValues, "IADC") + "\n"
        result += `  ${iadcValues.map(v => v.toFixed(0).padStart(3)).join(" ")}%\n\n`
      }

      // Summary
      const latestDwc = dwcValues[dwcValues.length - 1]
      const avgDwc = dwcValues.reduce((a, b) => a + b, 0) / dwcValues.length
      result += `📊 **Résumé DWC:**\n`
      result += `  Dernier: ${latestDwc.toFixed(1)}%\n`
      result += `  Moyenne: ${avgDwc.toFixed(1)}%\n`
      result += `  Min: ${Math.min(...dwcValues).toFixed(1)}%\n`
      result += `  Max: ${Math.max(...dwcValues).toFixed(1)}%`

      return result
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 9: Get drivers with declining performance (regression)
 */
const getRegression = createTool({
  description:
    "Trouve les livreurs dont les performances ont baissé par rapport à la semaine précédente. Utile pour détecter les problèmes tôt.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    year: z.number().describe("L'année"),
    week: z.number().describe("La semaine"),
    threshold: z.number().default(-2).describe("Seuil de baisse minimum (ex: -2 = baisse de 2% ou plus)"),
    limit: z.number().default(10).describe("Nombre max de résultats"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const drivers = await ctx.runQuery(api.stats.getDashboardDrivers, {
        stationId: args.stationId as Id<"stations">,
        year: args.year,
        week: args.week,
      }) as DashboardDriver[]

      if (drivers.length === 0) {
        return `Aucun livreur trouvé pour la semaine ${args.week}/${args.year}.`
      }

      // Filter by negative trend below threshold
      const regressed = drivers
        .filter(d => d.trend !== null && d.trend < args.threshold)
        .sort((a, b) => (a.trend ?? 0) - (b.trend ?? 0))
        .slice(0, args.limit)

      if (regressed.length === 0) {
        return `✅ Aucun livreur en régression significative (>${Math.abs(args.threshold)}%) pour la semaine ${args.week}/${args.year}.`
      }

      const tierEmoji: Record<string, string> = {
        fantastic: "🟢",
        great: "🔵",
        fair: "🟡",
        poor: "🔴",
      }

      const lines = regressed.map((d, i) => {
        const trendText = d.trend !== null ? `${d.trend > 0 ? "+" : ""}${d.trend}%` : "N/A"
        return `${i + 1}. ${tierEmoji[d.tier]} **${d.name}**
   DWC: ${d.dwcPercent}% (📉 ${trendText} vs semaine précédente)
   Tier: ${d.tier.toUpperCase()}`
      })

      return `⚠️ **Livreurs en régression** - Semaine ${args.week}/${args.year}
(Seuil: ${args.threshold}% ou moins)

${lines.join("\n\n")}

💡 **Action recommandée:** Planifier des discussions de coaching pour ces livreurs.`
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 10: Get coaching suggestions for underperforming drivers
 */
const suggestCoaching = createTool({
  description:
    "Suggère des actions de coaching prioritaires pour les livreurs en difficulté. Utilise des algorithmes de priorisation.",
  args: z.object({
    stationId: z.string().describe("L'ID de la station"),
    year: z.number().describe("L'année"),
    week: z.number().describe("La semaine"),
    limit: z.number().default(5).describe("Nombre max de suggestions"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const suggestions = await ctx.runQuery(api.coaching.getCoachingSuggestions, {
        stationId: args.stationId as Id<"stations">,
        year: args.year,
        week: args.week,
      }) as CoachingSuggestion[]

      if (!suggestions || suggestions.length === 0) {
        return `✅ Aucune suggestion de coaching pour la semaine ${args.week}/${args.year}. Tous les livreurs sont au-dessus du seuil (96% DWC) ou ont déjà une action en cours.`
      }

      const limited = suggestions.slice(0, args.limit)

      const priorityEmoji: Record<string, string> = {
        high: "🔴",
        negative_trend: "🟠",
        relapse: "🟡",
        new_poor: "🟡",
      }

      const priorityLabel: Record<string, string> = {
        high: "URGENT",
        negative_trend: "Tendance négative",
        relapse: "Rechute",
        new_poor: "Nouveau sous-performant",
      }

      const actionTypeByPriority: Record<string, string> = {
        high: "Discussion urgente + Plan d'action",
        negative_trend: "Discussion préventive",
        relapse: "Rappel des bonnes pratiques",
        new_poor: "Point de situation",
      }

      const lines = limited.map((s, i) => {
        return `${i + 1}. ${priorityEmoji[s.priority]} **${s.driverName}**
   📊 DWC: ${s.driverDwc}% (${s.driverTier.toUpperCase()})
   🏷️ Priorité: ${priorityLabel[s.priority]}
   ❌ Erreur principale: ${s.mainError} (${s.mainErrorCount}x)
   💬 ${s.reason}
   ✅ Action suggérée: ${actionTypeByPriority[s.priority]}`
      })

      return `🎯 **Suggestions de Coaching** - Semaine ${args.week}/${args.year}

${lines.join("\n\n")}

---
💡 Utilise \`generateMessage\` pour créer un message WhatsApp personnalisé pour un livreur.`
    } catch (error) {
      return `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    }
  },
})

/**
 * Tool 11: Generate WhatsApp coaching message
 */
const generateMessage = createTool({
  description:
    "Génère un message WhatsApp personnalisé pour un livreur, adapté au type d'action de coaching.",
  args: z.object({
    driverName: z.string().describe("Le nom du livreur"),
    actionType: z.enum(["discussion", "warning", "training", "suspension"]).describe(
      "Type d'action: discussion (encourageant), warning (avertissement), training (formation), suspension"
    ),
    dwcPercent: z.number().describe("Le DWC actuel du livreur"),
    reason: z.string().describe("La raison ou le sujet principal (ex: Contact Miss élevé)"),
    tone: z.enum(["encourageant", "ferme"]).default("encourageant").describe("Le ton du message"),
  }),
  handler: async (_ctx, args): Promise<string> => {
    const { driverName, actionType, dwcPercent, reason, tone } = args

    let message = ""

    switch (actionType) {
      case "discussion":
        if (tone === "encourageant") {
          message = `💬 *Coaching - Discussion*

Bonjour ${driverName},

J'aimerais discuter avec toi de tes performances récentes.

📊 DWC actuel: *${dwcPercent.toFixed(1)}%*
📝 Sujet: ${reason}

On peut en parler cette semaine ?

Merci 👍`
        } else {
          message = `💬 *Point Performance*

${driverName},

Ton DWC est à *${dwcPercent.toFixed(1)}%*. On doit en parler.

📝 Sujet: ${reason}

Dis-moi quand tu es disponible.`
        }
        break

      case "warning":
        message = `⚠️ *Avertissement Officiel*

${driverName},

Ton DWC est à *${dwcPercent.toFixed(1)}%* - en dessous du seuil requis.

📝 Raison: ${reason}

Il faut agir rapidement pour éviter l'escalade.

Prochaine étape: discussion cette semaine.`
        break

      case "training":
        message = `📚 *Formation Prévue*

Bonjour ${driverName},

Une formation est prévue pour t'aider à améliorer tes performances.

📊 DWC: *${dwcPercent.toFixed(1)}%*
🎯 Focus: ${reason}

On compte sur toi !`
        break

      case "suspension":
        message = `🚫 *Suspension*

${driverName},

Suite aux problèmes récurrents (DWC: *${dwcPercent.toFixed(1)}%*), une suspension est appliquée.

📝 Raison: ${reason}

Contacte ton manager pour les prochaines étapes.`
        break
    }

    return `📱 **Message WhatsApp prêt à envoyer:**

---
${message}
---

💡 Copie ce message et envoie-le via WhatsApp.`
  },
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get ISO week number and year
 * Important: At year boundaries, the ISO week year may differ from calendar year
 * e.g., Dec 29, 2025 is week 1 of 2026
 */
function getISOWeekAndYear(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  // The ISO week year is the year of the Thursday of that week
  const year = d.getUTCFullYear()
  return { week, year }
}

function getWeekNumber(date: Date): number {
  return getISOWeekAndYear(date).week
}

// ============================================
// AGENT DEFINITIONS
// ============================================

const systemInstructions = `Tu es l'assistant IA de DSPilot, une plateforme de gestion des performances des livreurs Amazon.

🛠️ **11 OUTILS DISPONIBLES:**

📊 DONNÉES DE BASE:
- getCurrentDate: Date et semaine actuelles
- getStationKPIs: KPIs station (DWC%, IADC%, tiers)
- getDriverPerformance: Recherche un livreur par nom
- listDrivers: Liste livreurs avec filtres (all/underperforming/top/alerts)
- compareWeeks: Compare 2 semaines

🔍 ANALYSE:
- getErrorBreakdown: Détail des erreurs DWC/IADC
- getTopDriversWithErrors: Top livreurs avec le plus d'erreurs
- getTrend: Évolution DWC/IADC sur N semaines (graphique)
- getRegression: Livreurs dont les performances baissent

🎯 COACHING:
- suggestCoaching: Suggestions de coaching prioritaires
- generateMessage: Génère un message WhatsApp personnalisé

⚠️ REGLES CRITIQUES:
1. Extrais le stationId du contexte [CONTEXTE STATION]
2. **SEMAINE PAR DEFAUT:** Si "Semaine selectionnee: SXX/YYYY" est dans le contexte, utilise TOUJOURS cette semaine pour "cette semaine", "mes KPIs", "sous-performants", etc.
3. getCurrentDate UNIQUEMENT si l'utilisateur demande explicitement la date du jour
4. Pour "évolution" ou "tendance" → getTrend
5. Pour "qui régresse" ou "baisse" → getRegression
6. Pour "coaching" ou "suggère" → suggestCoaching
7. Pour "message" ou "WhatsApp" → generateMessage
8. Formate avec **markdown** et émojis

📚 CONTEXTE METIER:
- DWC: % livraisons conformes
- IADC: % conformité adresse
- Tiers: Fantastic (≥98.5%), Great (≥96%), Fair (≥90%), Poor (<90%)

💬 EXEMPLES:
- "Mon DWC cette semaine?" → getStationKPIs avec semaine contexte
- "Évolution sur 4 semaines" → getTrend(weeks=4)
- "Qui régresse?" → getRegression
- "Suggère du coaching" → suggestCoaching
- "Message pour Jean" → generateMessage
- "Compare S50 et S51" → compareWeeks
- "Comment va Dupont?" → getDriverPerformance("Dupont")

LANGUE: Réponds toujours en français.`

/**
 * Main DSPilot Super Agent (OpenAI GPT-5.2)
 */
export const dspilotAgent = new Agent(components.agent, {
  name: "DSPilot Super Agent",
  languageModel: openai("gpt-5.2"),
  instructions: systemInstructions,
  tools: {
    getCurrentDate,
    getStationKPIs,
    getDriverPerformance,
    listDrivers,
    compareWeeks,
    getErrorBreakdown,
    getTopDriversWithErrors,
    getTrend,
    getRegression,
    suggestCoaching,
    generateMessage,
  },
  maxSteps: 10,
})

/**
 * Fallback Agent (Anthropic Claude)
 */
export const dspilotAgentFallback = new Agent(components.agent, {
  name: "DSPilot Super Agent (Fallback)",
  languageModel: anthropic("claude-sonnet-4-20250514"),
  instructions: systemInstructions,
  tools: {
    getCurrentDate,
    getStationKPIs,
    getDriverPerformance,
    listDrivers,
    compareWeeks,
    getErrorBreakdown,
    getTopDriversWithErrors,
    getTrend,
    getRegression,
    suggestCoaching,
    generateMessage,
  },
  maxSteps: 10,
})
