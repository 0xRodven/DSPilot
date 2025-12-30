import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";

// Regex pour validation E.164
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Valide un numéro de téléphone au format E.164
 */
function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

// ============================================
// DRIVER PHONE MUTATIONS
// ============================================

/**
 * Met à jour le numéro de téléphone d'un driver
 */
export const updateDriverPhone = mutation({
  args: {
    driverId: v.id("drivers"),
    phoneNumber: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error("Driver non trouvé");
    }

    // Validation du numéro si présent
    if (args.phoneNumber && !isValidE164(args.phoneNumber)) {
      throw new Error(
        "Format de numéro invalide. Utilisez le format E.164 (ex: +33612345678)"
      );
    }

    await ctx.db.patch(args.driverId, {
      phoneNumber: args.phoneNumber ?? undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Toggle l'opt-in WhatsApp pour un driver
 */
export const toggleDriverWhatsappOptIn = mutation({
  args: {
    driverId: v.id("drivers"),
    optIn: v.boolean(),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error("Driver non trouvé");
    }

    await ctx.db.patch(args.driverId, {
      whatsappOptIn: args.optIn,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// WHATSAPP SETTINGS QUERIES & MUTATIONS
// ============================================

/**
 * Récupère les settings WhatsApp d'une station
 */
export const getWhatsappSettings = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("whatsappSettings")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .first();

    // Retourne les valeurs par défaut si pas de settings
    if (!settings) {
      return {
        enabled: false,
        sendDay: 1, // Lundi
        sendHour: 8, // 8h
        timezone: "Europe/Paris",
      };
    }

    return settings;
  },
});

/**
 * Met à jour les settings WhatsApp d'une station
 */
export const updateWhatsappSettings = mutation({
  args: {
    stationId: v.id("stations"),
    enabled: v.boolean(),
    sendDay: v.number(),
    sendHour: v.number(),
    timezone: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.sendDay < 0 || args.sendDay > 6) {
      throw new Error("Le jour doit être entre 0 (dimanche) et 6 (samedi)");
    }
    if (args.sendHour < 0 || args.sendHour > 23) {
      throw new Error("L'heure doit être entre 0 et 23");
    }

    const existing = await ctx.db
      .query("whatsappSettings")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        sendDay: args.sendDay,
        sendHour: args.sendHour,
        timezone: args.timezone,
        updatedBy: args.userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("whatsappSettings", {
        stationId: args.stationId,
        enabled: args.enabled,
        sendDay: args.sendDay,
        sendHour: args.sendHour,
        timezone: args.timezone,
        updatedBy: args.userId,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// ============================================
// MESSAGE HISTORY QUERIES
// ============================================

/**
 * Récupère l'historique des messages WhatsApp pour un driver
 */
export const getDriverMessageHistory = query({
  args: {
    driverId: v.id("drivers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("whatsappMessages")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(args.limit ?? 20);

    return messages;
  },
});

/**
 * Récupère les statistiques d'envoi pour une station/semaine
 */
export const getWeeklyMessageStats = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("whatsappMessages")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week)
      )
      .collect();

    const stats = {
      total: messages.length,
      sent: messages.filter((m) => m.status === "sent").length,
      delivered: messages.filter((m) => m.status === "delivered").length,
      failed: messages.filter((m) => m.status === "failed" || m.status === "undelivered").length,
      pending: messages.filter((m) => m.status === "pending").length,
    };

    return stats;
  },
});

/**
 * Récupère les drivers éligibles pour l'envoi WhatsApp (avec phone + opt-in)
 */
export const getEligibleDrivers = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_station_active", (q) =>
        q.eq("stationId", args.stationId).eq("isActive", true)
      )
      .collect();

    // Filtrer ceux avec numéro et opt-in
    const eligible = drivers.filter(
      (d) => d.phoneNumber && d.whatsappOptIn === true
    );

    return eligible;
  },
});

// ============================================
// MESSAGE CREATION (Internal)
// ============================================

/**
 * Crée un message en attente d'envoi (internal)
 */
export const createPendingMessage = internalMutation({
  args: {
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    year: v.number(),
    week: v.number(),
    phoneNumber: v.string(),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("whatsappMessages", {
      stationId: args.stationId,
      driverId: args.driverId,
      year: args.year,
      week: args.week,
      phoneNumber: args.phoneNumber,
      messageContent: args.messageContent,
      status: "pending",
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Met à jour le status d'un message après envoi (internal)
 */
export const updateMessageStatus = internalMutation({
  args: {
    messageId: v.id("whatsappMessages"),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("undelivered")
    ),
    messageSid: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"whatsappMessages">> = {
      status: args.status,
    };

    if (args.messageSid) {
      updates.messageSid = args.messageSid;
    }
    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }
    if (args.status === "sent") {
      updates.sentAt = Date.now();
    }
    if (args.status === "delivered") {
      updates.deliveredAt = Date.now();
    }

    await ctx.db.patch(args.messageId, updates);
  },
});

// ============================================
// RECAP CONTENT GENERATION
// ============================================

/**
 * Types pour le contenu du récap
 */
type RecapData = {
  driverName: string;
  week: number;
  year: number;
  dwcPercent: number;
  iadcPercent: number;
  tier: "fantastic" | "great" | "fair" | "poor";
  trend: number; // +/- vs semaine précédente
  deliveries: number;
  rank: number | null;
  totalDrivers: number;
  topErrors: { name: string; count: number }[];
  coachingActions: { type: string; status: string }[];
};

/**
 * Génère le contenu du message récapitulatif
 */
export function generateRecapMessage(data: RecapData): string {
  const tierEmoji = {
    fantastic: "🌟",
    great: "✅",
    fair: "⚠️",
    poor: "🔴",
  };

  const tierLabel = {
    fantastic: "Fantastic",
    great: "Great",
    fair: "Fair",
    poor: "Poor",
  };

  const trendArrow = data.trend > 0 ? "📈" : data.trend < 0 ? "📉" : "➡️";
  const trendText =
    data.trend !== 0
      ? ` (${data.trend > 0 ? "+" : ""}${data.trend.toFixed(1)}%)`
      : "";

  // Top 3 erreurs
  const errorsText =
    data.topErrors.length > 0
      ? data.topErrors
          .slice(0, 3)
          .map((e, i) => `${i + 1}. ${e.name} (${e.count}x)`)
          .join("\n")
      : "Aucune erreur majeure 👏";

  // Coaching en cours
  const coachingText =
    data.coachingActions.length > 0
      ? data.coachingActions
          .filter((a) => a.status === "pending")
          .map((a) => `• ${a.type} en cours`)
          .join("\n") || "Aucune action en cours"
      : "Aucune action en cours";

  // Conseil personnalisé basé sur le tier
  let tip = "";
  if (data.tier === "poor") {
    tip = "Concentre-toi sur les bases : photo de livraison et confirmation client.";
  } else if (data.tier === "fair") {
    tip = "Tu progresses ! Réduis les erreurs Contact Miss pour passer Great.";
  } else if (data.tier === "great") {
    tip = "Excellent travail ! Maintiens cette régularité pour atteindre Fantastic.";
  } else {
    tip = "Performance exceptionnelle ! Continue comme ça 💪";
  }

  const message = `📊 *Récap Semaine ${data.week}*

Bonjour ${data.driverName},

📈 *Performance*
DWC: ${data.dwcPercent.toFixed(1)}% ${tierEmoji[data.tier]} ${tierLabel[data.tier]} ${trendArrow}${trendText}
IADC: ${data.iadcPercent.toFixed(1)}%
Livraisons: ${data.deliveries}
${data.rank ? `Rang: #${data.rank}/${data.totalDrivers}` : ""}

❌ *Top erreurs à corriger*
${errorsText}

📋 *Coaching*
${coachingText}

💡 *Conseil*
${tip}

Bonne semaine! 🚚`;

  return message;
}

// ============================================
// TWILIO SEND ACTION
// ============================================

/**
 * Action pour envoyer un message WhatsApp via Twilio (internal)
 */
export const sendWhatsappMessage = internalAction({
  args: {
    messageId: v.id("whatsappMessages"),
    phoneNumber: v.string(),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Get Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
        messageId: args.messageId,
        status: "failed",
        errorMessage: "Configuration Twilio manquante",
      });
      throw new Error("Configuration Twilio manquante. Configurez les variables d'environnement.");
    }

    try {
      // Call Twilio API
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const body = new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${args.phoneNumber}`,
        Body: args.messageContent,
      });

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        // Twilio error
        await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
          messageId: args.messageId,
          status: "failed",
          errorMessage: result.message || "Erreur Twilio inconnue",
        });
        throw new Error(result.message || "Erreur lors de l'envoi Twilio");
      }

      // Success
      await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
        messageId: args.messageId,
        status: "sent",
        messageSid: result.sid,
      });

      return { success: true, sid: result.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
        messageId: args.messageId,
        status: "failed",
        errorMessage,
      });
      throw error;
    }
  },
});

/**
 * Action interne pour envoyer un récapitulatif à un driver
 * Utilisée par le cron job
 */
export const sendRecapToDriver = internalAction({
  args: {
    driverId: v.id("drivers"),
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId: Id<"whatsappMessages"> }> => {
    // Get driver info
    const driver = await ctx.runQuery(internal.whatsapp.getDriverForRecap, {
      driverId: args.driverId,
    }) as { name: string; phoneNumber: string | undefined; whatsappOptIn: boolean | undefined } | null;

    if (!driver || !driver.phoneNumber) {
      throw new Error("Driver non trouvé ou sans numéro de téléphone");
    }

    // Get driver stats for recap
    const stats = await ctx.runQuery(internal.whatsapp.getDriverStatsForRecap, {
      driverId: args.driverId,
      year: args.year,
      week: args.week,
    }) as {
      dwcPercent: number;
      iadcPercent: number;
      tier: "fantastic" | "great" | "fair" | "poor";
      trend: number;
      deliveries: number;
      rank: number | null;
      totalDrivers: number;
      topErrors: { name: string; count: number }[];
      coachingActions: { type: string; status: string }[];
    } | null;

    if (!stats) {
      throw new Error("Pas de statistiques disponibles pour ce driver cette semaine");
    }

    // Generate message content
    const messageContent = generateRecapMessage({
      driverName: driver.name.split(" ")[0], // Use first name only
      week: args.week,
      year: args.year,
      dwcPercent: stats.dwcPercent,
      iadcPercent: stats.iadcPercent,
      tier: stats.tier,
      trend: stats.trend,
      deliveries: stats.deliveries,
      rank: stats.rank,
      totalDrivers: stats.totalDrivers,
      topErrors: stats.topErrors,
      coachingActions: stats.coachingActions,
    });

    // Create pending message record
    const messageId = await ctx.runMutation(internal.whatsapp.createPendingMessage, {
      stationId: args.stationId,
      driverId: args.driverId,
      year: args.year,
      week: args.week,
      phoneNumber: driver.phoneNumber,
      messageContent,
    }) as Id<"whatsappMessages">;

    // Send via Twilio
    await ctx.runAction(internal.whatsapp.sendWhatsappMessage, {
      messageId,
      phoneNumber: driver.phoneNumber,
      messageContent,
    });

    return { success: true, messageId };
  },
});

// ============================================
// INTERNAL QUERIES FOR RECAP GENERATION
// ============================================

/**
 * Get driver info for recap (internal)
 */
export const getDriverForRecap = internalQuery({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    return {
      name: driver.name,
      phoneNumber: driver.phoneNumber,
      whatsappOptIn: driver.whatsappOptIn,
    };
  },
});

/**
 * Action publique pour envoyer un récap manuel à un driver
 * Appelée depuis le bouton "Envoyer rapport WhatsApp" dans l'UI
 */
export const sendManualRecap = action({
  args: {
    driverId: v.id("drivers"),
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId: Id<"whatsappMessages"> }> => {
    // Use the internal action to send
    const result = await ctx.runAction(internal.whatsapp.sendRecapToDriver, {
      driverId: args.driverId,
      stationId: args.stationId,
      year: args.year,
      week: args.week,
    }) as { success: boolean; messageId: Id<"whatsappMessages"> };

    return result;
  },
});

/**
 * Get driver stats for recap (internal)
 */
export const getDriverStatsForRecap = internalQuery({
  args: {
    driverId: v.id("drivers"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Get weekly stats
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", args.year).eq("week", args.week)
      )
      .first();

    if (!weeklyStats) return null;

    // Calculate percentages
    const dwcTotal = weeklyStats.dwcCompliant + weeklyStats.dwcMisses + weeklyStats.failedAttempts;
    const dwcPercent = dwcTotal > 0 ? (weeklyStats.dwcCompliant / dwcTotal) * 100 : 0;

    const iadcTotal = weeklyStats.iadcCompliant + weeklyStats.iadcNonCompliant;
    const iadcPercent = iadcTotal > 0 ? (weeklyStats.iadcCompliant / iadcTotal) * 100 : 0;

    // Determine tier
    let tier: "fantastic" | "great" | "fair" | "poor" = "poor";
    if (dwcPercent >= 98.5) tier = "fantastic";
    else if (dwcPercent >= 96) tier = "great";
    else if (dwcPercent >= 90) tier = "fair";

    // Get previous week for trend
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;

    const prevStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", prevYear).eq("week", prevWeek)
      )
      .first();

    let trend = 0;
    if (prevStats) {
      const prevTotal = prevStats.dwcCompliant + prevStats.dwcMisses + prevStats.failedAttempts;
      const prevDwc = prevTotal > 0 ? (prevStats.dwcCompliant / prevTotal) * 100 : 0;
      trend = dwcPercent - prevDwc;
    }

    // Get driver for stationId
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    // Get ranking
    const allDriverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", driver.stationId).eq("year", args.year).eq("week", args.week)
      )
      .collect();

    const rankedDrivers = allDriverStats
      .map((s) => {
        const t = s.dwcCompliant + s.dwcMisses + s.failedAttempts;
        return { driverId: s.driverId, dwc: t > 0 ? (s.dwcCompliant / t) * 100 : 0 };
      })
      .sort((a, b) => b.dwc - a.dwc);

    const rank = rankedDrivers.findIndex((d) => d.driverId === args.driverId) + 1;

    // Get top errors from breakdown
    const topErrors: { name: string; count: number }[] = [];
    if (weeklyStats.dwcBreakdown) {
      const breakdown = weeklyStats.dwcBreakdown;
      const errorMap = [
        { name: "Contact Miss", count: breakdown.contactMiss },
        { name: "Photo Defect", count: breakdown.photoDefect },
        { name: "No Photo", count: breakdown.noPhoto },
        { name: "OTP Miss", count: breakdown.otpMiss },
        { name: "Other", count: breakdown.other },
      ];
      errorMap
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .forEach((e) => topErrors.push(e));
    }

    // Get coaching actions
    const coachingActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_driver_status", (q) =>
        q.eq("driverId", args.driverId).eq("status", "pending")
      )
      .collect();

    return {
      dwcPercent,
      iadcPercent,
      tier,
      trend,
      deliveries: dwcTotal,
      rank: rank || null,
      totalDrivers: rankedDrivers.length,
      topErrors,
      coachingActions: coachingActions.map((a) => ({
        type: a.actionType,
        status: a.status,
      })),
    };
  },
});
