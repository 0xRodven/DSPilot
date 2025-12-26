import { mutation } from "./_generated/server";

// Clear all data for testing purposes
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in order to respect foreign key-like relationships
    const tables = [
      "coachingActions",
      "imports",
      "stationWeeklyStats",
      "driverWeeklyStats",
      "driverDailyStats",
      "drivers",
      "stations",
    ] as const;

    const counts: Record<string, number> = {};

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      counts[table] = docs.length;
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    return counts;
  },
});
