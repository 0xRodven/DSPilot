import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);
  const stationId = "m5793emg00bwkq7n082dyrp4kd841cak" as Id<"stations">;

  // 1. Delete DNR/Investigations S12-S14
  const r1 = await client.mutation(api.dnr.deleteByWeekRange, {
    stationId,
    yearFrom: 2026,
    weekFrom: 12,
    yearTo: 2026,
    weekTo: 14,
  });
  console.log("[1/4] DNR S12-S14 deleted:", r1.deleted);

  // 2. Delete reports S12-S14
  let reportsDeleted = 0;
  for (const week of [12, 13, 14]) {
    try {
      const reports = await client.query(api.reporting.getReports, { stationId, year: 2026, week });
      for (const r of reports) {
        await client.mutation(api.reporting.deleteReport, { reportId: r._id });
        reportsDeleted++;
        console.log("  Deleted report:", r.title?.slice(0, 50));
      }
    } catch (e) {
      /* no reports */
    }
  }
  console.log("[2/4] Reports deleted:", reportsDeleted);

  // 3. Delete weekly stats S12-S14
  let statsDeleted = 0;
  for (const week of [12, 13, 14]) {
    try {
      const stats = await client.query(api.stats.getStationWeeklyStats, { stationId, year: 2026, week });
      if (stats) {
        await client.mutation(api.stats.deleteWeeklyStats, { statsId: stats._id });
        statsDeleted++;
        console.log("  Deleted weekly stats S" + week);
      }
    } catch (e) {
      /* no stats or no delete mutation */
    }
  }
  console.log("[3/4] Weekly stats deleted:", statsDeleted);

  // 4. Delete driver weekly stats S12-S14
  let driverStatsDeleted = 0;
  for (const week of [12, 13, 14]) {
    try {
      const driverStats = await client.query(api.stats.getDriverWeeklyStatsBulk, { stationId, year: 2026, week });
      if (driverStats && Array.isArray(driverStats)) {
        for (const ds of driverStats) {
          await client.mutation(api.stats.deleteDriverWeeklyStats, { statsId: ds._id });
          driverStatsDeleted++;
        }
      }
    } catch (e) {
      /* no bulk query or no delete mutation */
    }
  }
  console.log("[4/4] Driver weekly stats deleted:", driverStatsDeleted);

  console.log("Full cleanup done!");
}
main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
