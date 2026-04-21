import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";

async function main() {
  const client = new ConvexHttpClient("https://sincere-rhinoceros-718.convex.cloud");
  (client as unknown as { setAdminAuth(t: string): void }).setAdminAuth(
    "prod:sincere-rhinoceros-718|eyJ2MiI6ImYzMTdhZDMzM2Y1ZjRkODlhN2Y4MDMzMWI5MTM0NzJmIn0=",
  );

  // Get station by known ID
  const sid = "m5793emg00bwkq7n082dyrp4kd841cak" as any;
  const station = await client.query(api.stations.getStation, { stationId: sid });
  console.log(`Station: ${station?.code} - ${station?.name}`);

  const year = 2026;
  const week = 14;

  // 1. DNR Investigations (concessions)
  const driverCounts = await client.query(api.dnr.getDriverDnrCount, { stationId: sid, year, week });
  const totalInvestigations = Object.values(driverCounts).reduce((a: number, b: number) => a + b, 0);
  console.log(`\n--- DNR Investigations (concessions) S${week} ---`);
  console.log(`Total: ${totalInvestigations}`);

  // 2. DNR KPIs
  try {
    const kpis = await client.query(api.dnr.getKpis, { stationId: sid, year, week });
    console.log(`\n--- DNR KPIs S${week} ---`);
    console.log(JSON.stringify(kpis, null, 2));
  } catch (e) {
    console.log("KPIs failed:", (e as Error).message?.slice(0, 100));
  }

  // 3. Check investigations for multiple weeks
  for (const w of [12, 13, 14]) {
    const counts = await client.query(api.dnr.getDriverDnrCount, { stationId: sid, year, week: w });
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
    console.log(`S${w}: ${total} DNR investigations, ${Object.keys(counts).length} drivers`);
  }

  // 4. Try to get associate stats for DNR count
  try {
    const investigations = await client.query(api.dnr.getInvestigations, { stationId: sid, year, week });
    console.log(`\n--- Investigations detail S${week} ---`);
    console.log(`Count: ${investigations.length}`);
    if (investigations.length > 0) {
      for (const inv of investigations.slice(0, 5)) {
        console.log(`  ${inv.trackingId} - ${inv.status} - ${inv.entryType || "concession"}`);
      }
    }
  } catch (e) {
    console.log("Investigations query failed:", (e as Error).message?.slice(0, 100));
  }

  // 5. Try report data
  try {
    const report = await client.query(api.reporting.getReportData, {
      stationCode: station?.code || "FR-PSUA-DIF1",
      year,
      week,
    });
    if (report && report.dnr) {
      console.log(`\n--- Report DNR data S${week} ---`);
      console.log(JSON.stringify(report.dnr, null, 2));
    }
  } catch (e) {
    console.log("Report data:", (e as Error).message?.slice(0, 150));
  }
}

main().catch(console.error);
