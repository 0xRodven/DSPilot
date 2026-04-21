import { ConvexHttpClient } from "convex/browser";

import { api } from "./convex/_generated/api";
import type { Id } from "./convex/_generated/dataModel";

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);
  const sid = "m5793emg00bwkq7n082dyrp4kd841cak" as Id<"stations">;

  for (const week of [12, 13, 14]) {
    const counts = await client.query(api.dnr.getDriverDnrCount, { stationId: sid, year: 2026, week });
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
    console.log(`S${week}: ${total} entries, ${Object.keys(counts).length} drivers`);
  }

  // Check a sample entry for address data
  const counts14 = await client.query(api.dnr.getDriverDnrCount, { stationId: sid, year: 2026, week: 14 });
  console.log("S14 counts:", JSON.stringify(counts14).slice(0, 200));
}
main();
