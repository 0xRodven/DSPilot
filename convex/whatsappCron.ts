import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Vérifie quelles stations doivent envoyer leurs récaps WhatsApp
 * et déclenche les envois si nécessaire
 */
export const checkAndSendRecaps = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all stations with WhatsApp enabled
    const stationsToCheck = await ctx.runQuery(
      internal.whatsappCron.getStationsToSend
    );

    if (stationsToCheck.length === 0) {
      console.log("[WhatsApp Cron] No stations to send recaps to");
      return { sent: 0 };
    }

    let totalSent = 0;

    for (const station of stationsToCheck) {
      try {
        // Get eligible drivers for this station
        const drivers = await ctx.runQuery(
          internal.whatsappCron.getEligibleDriversForStation,
          { stationId: station.stationId }
        );

        if (drivers.length === 0) {
          console.log(`[WhatsApp Cron] No eligible drivers for station ${station.stationId}`);
          continue;
        }

        // Get current week info
        const now = new Date();
        const week = getWeekNumber(now);
        const year = now.getFullYear();

        // Send recap to each driver with a delay to avoid rate limiting
        for (let i = 0; i < drivers.length; i++) {
          const driver = drivers[i];

          // Add delay between messages (1 second per message)
          if (i > 0) {
            await sleep(1000);
          }

          try {
            await ctx.runAction(internal.whatsapp.sendRecapToDriver, {
              driverId: driver._id,
              stationId: station.stationId,
              year,
              week,
            });
            totalSent++;
            console.log(`[WhatsApp Cron] Sent recap to ${driver.name}`);
          } catch (error) {
            console.error(`[WhatsApp Cron] Failed to send to ${driver.name}:`, error);
          }
        }
      } catch (error) {
        console.error(`[WhatsApp Cron] Error processing station ${station.stationId}:`, error);
      }
    }

    console.log(`[WhatsApp Cron] Total recaps sent: ${totalSent}`);
    return { sent: totalSent };
  },
});

/**
 * Get stations that should send recaps now
 * Checks if current hour matches the station's configured send time
 */
export const getStationsToSend = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all WhatsApp settings
    const allSettings = await ctx.db.query("whatsappSettings").collect();

    // Filter to enabled stations that should send now
    const now = new Date();
    const currentDayUTC = now.getUTCDay();
    const currentHourUTC = now.getUTCHours();

    const stationsToSend = allSettings.filter((settings) => {
      if (!settings.enabled) return false;

      // Convert station's configured time to UTC for comparison
      // This is simplified - in production you'd want proper timezone handling
      const targetHourUTC = convertToUTC(settings.sendHour, settings.timezone);

      return (
        settings.sendDay === currentDayUTC &&
        targetHourUTC === currentHourUTC
      );
    });

    return stationsToSend;
  },
});

/**
 * Get eligible drivers for a station (internal version)
 */
export const getEligibleDriversForStation = internalQuery({
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

    // Filter to those with phone and opt-in
    return drivers.filter(
      (d) => d.phoneNumber && d.whatsappOptIn === true
    );
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get ISO week number from date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Convert local hour to UTC (simplified)
 * In production, use a proper timezone library like date-fns-tz
 */
function convertToUTC(hour: number, timezone: string): number {
  // Simplified offset mapping
  const offsets: Record<string, number> = {
    "Europe/Paris": 1, // CET (simplified, doesn't account for DST)
    "Europe/London": 0,
    "Europe/Berlin": 1,
    "America/New_York": -5,
  };

  const offset = offsets[timezone] ?? 0;
  let utcHour = hour - offset;

  // Handle day wrap
  if (utcHour < 0) utcHour += 24;
  if (utcHour >= 24) utcHour -= 24;

  return utcHour;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
