import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);
  const stationId = "m5793emg00bwkq7n082dyrp4kd841cak" as Id<"stations">;

  let total = 0;
  for (let week = 1; week <= 52; week++) {
    try {
      const reports = await client.query(api.reporting.getReports, { stationId, year: 2026, week });
      for (const r of reports) {
        await client.mutation(api.reporting.deleteReport, { reportId: r._id });
        total++;
        console.log(`  Deleted: ${r.title?.slice(0, 60)}`);
      }
    } catch (e) {
      /* no reports */
    }
  }
  console.log(`\nTotal reports deleted: ${total}`);
}
main();
