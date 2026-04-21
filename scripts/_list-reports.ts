import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);
  const stationId = "m5793emg00bwkq7n082dyrp4kd841cak" as Id<"stations">;

  const reports = await client.query(api.reporting.listReports, { stationId, limit: 100 });
  console.log(`Total reports: ${reports.length}`);
  for (const r of reports) {
    console.log(`  [${r.reportType}] S${r.week}/${r.year} — ${r.title?.slice(0, 50)}`);
  }

  // Delete ALL
  for (const r of reports) {
    await client.mutation(api.reporting.deleteReport, { reportId: r._id });
    console.log(`  Deleted: ${r.title?.slice(0, 50)}`);
  }
  console.log(`\nDeleted ${reports.length} reports`);
}
main();
