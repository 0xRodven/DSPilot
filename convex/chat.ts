import { v } from "convex/values"
import { action } from "./_generated/server"
import { api } from "./_generated/api"
import { dspilotAgent, dspilotAgentFallback } from "./agent"

// Type for the prompt argument - explicit typing to help TypeScript inference
type PromptArg = { prompt: string }

/**
 * DSPilot Chat API
 *
 * Simplified chat API that works with the Convex Agent component.
 */

// ============================================
// THREAD MANAGEMENT
// ============================================

/**
 * Create a new chat thread for a station
 */
export const createThread = action({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args): Promise<{ threadId: string }> => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifie")
    }

    // Verify station ownership
    const station = await ctx.runQuery(api.stations.getStation, {
      stationId: args.stationId,
    })
    if (!station) {
      throw new Error("Station non trouvee")
    }
    if (station.ownerId !== identity.subject) {
      throw new Error("Acces non autorise a cette station")
    }

    // Create thread
    const { threadId } = await dspilotAgent.createThread(ctx, {
      userId: identity.subject,
    })

    return { threadId }
  },
})

// ============================================
// MESSAGE SENDING
// ============================================

/**
 * Send a message and get response
 */
export const sendMessage = action({
  args: {
    threadId: v.string(),
    stationId: v.id("stations"),
    prompt: v.string(),
    selectedYear: v.optional(v.number()),
    selectedWeek: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    text: string
    toolCalls?: Array<{ toolName: string }>
    fallback?: boolean
  }> => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifie")
    }

    // Verify station ownership
    const station = await ctx.runQuery(api.stations.getStation, {
      stationId: args.stationId,
    })
    if (!station || station.ownerId !== identity.subject) {
      throw new Error("Acces non autorise")
    }

    // Inject station context into the prompt so the agent knows which station to query
    const weekContext = args.selectedYear && args.selectedWeek
      ? `Semaine selectionnee dans le dashboard: S${args.selectedWeek}/${args.selectedYear}
IMPORTANT: Quand l'utilisateur dit "cette semaine" ou pose une question sans preciser de semaine, utilise TOUJOURS cette semaine (S${args.selectedWeek}/${args.selectedYear}).`
      : ""

    const contextPrefix = `[CONTEXTE STATION]
stationId: ${args.stationId}
Station: ${station.name || station.code}
${weekContext}
[FIN CONTEXTE]

Question utilisateur: `

    // Prepare the prompt argument with station context
    const promptArg = { prompt: contextPrefix + args.prompt } as PromptArg

    try {
      // Generate response using agent directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await dspilotAgent.generateText(
        ctx,
        {
          threadId: args.threadId,
          userId: identity.subject,
        },
        promptArg as unknown as Parameters<typeof dspilotAgent.generateText>[2]
      )

      return {
        success: true,
        text: result.text,
        toolCalls: result.toolCalls?.map((tc) => ({ toolName: tc.toolName })),
      }
    } catch (error) {
      // Try fallback agent on failure
      console.error("Primary agent failed, trying fallback:", error)

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await dspilotAgentFallback.generateText(
          ctx,
          {
            threadId: args.threadId,
            userId: identity.subject,
          },
          promptArg as unknown as Parameters<typeof dspilotAgentFallback.generateText>[2]
        )

        return {
          success: true,
          text: result.text,
          toolCalls: result.toolCalls?.map((tc) => ({ toolName: tc.toolName })),
          fallback: true,
        }
      } catch (fallbackError) {
        console.error("Fallback agent also failed:", fallbackError)
        return {
          success: false,
          text: "Service temporairement indisponible. Veuillez reessayer.",
        }
      }
    }
  },
})
