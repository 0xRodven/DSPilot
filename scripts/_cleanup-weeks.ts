import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);
  const stationId = "m5793emg00bwkq7n082dyrp4kd841cak" as Id<"stations">;

  const r1 = await client.mutation(api.dnr.deleteByWeekRange, {
    stationId,
    yearFrom: 2026,
    weekFrom: 12,
    yearTo: 2026,
    weekTo: 14,
  });
  console.log("DNR S12-S14 deleted:", r1.deleted);

  for (const week of [12, 13, 14]) {
    try {
      const reports = await client.query(api.reporting.getReports, { stationId, year: 2026, week });
      for (const r of reports) {
        await client.mutation(api.reporting.deleteReport, { reportId: r._id });
        console.log("Deleted report:", r.title);
      }
    } catch (e) {
      console.log("No reports for week", week);
    }
  }
  console.log("Cleanup done");
}
main();
