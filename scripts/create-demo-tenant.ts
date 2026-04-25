// scripts/create-demo-tenant.ts
/**
 * One-time CLI to spawn the DSPilot Demo tenant.
 *
 * Usage:
 *   DSPILOT_INVITER_USER_ID=user_xxx \
 *   npm run create-demo -- --source-station-code=DIF1
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { anonymizeAmazonId, anonymizeDriverName } from "./anonymize-demo-data";

type Args = {
  sourceStationCode: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string> = {};
  let dryRun = false;
  for (const raw of argv.slice(2)) {
    if (raw === "--dry-run") {
      dryRun = true;
      continue;
    }
    const m = raw.match(/^--([^=]+)=(.*)$/);
    if (m) flags[m[1]] = m[2];
  }
  const src = flags["source-station-code"] ?? "DIF1";
  return { sourceStationCode: src, dryRun };
}

async function main() {
  const args = parseArgs(process.argv);
  const inviterUserId = process.env.DSPILOT_INVITER_USER_ID;
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!inviterUserId) throw new Error("DSPILOT_INVITER_USER_ID required (Ousmane's Clerk user id)");
  if (!clerkSecret) throw new Error("CLERK_SECRET_KEY required");
  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL required");

  const clerk = createClerkClient({ secretKey: clerkSecret });
  const convex = new ConvexHttpClient(convexUrl);

  console.log(`\n▶ Create demo tenant (source=${args.sourceStationCode})`);

  const src = await convex.query(api.stations.getStationByCodeInternal, {
    code: args.sourceStationCode,
  });

  if (!src) throw new Error(`Source station ${args.sourceStationCode} not found`);
  console.log(`  ✓ source station resolved: ${src.code}`);

  if (args.dryRun) {
    console.log("  DRY-RUN — stopping before writes");
    return;
  }

  const org = await clerk.organizations.createOrganization({
    name: "DSPilot Demo",
    createdBy: inviterUserId,
  });
  console.log(`  ✓ Clerk org: ${org.id}`);

  const demoStationId = await convex.mutation(api.demo.createDemoStationRow, {
    code: "DEMO",
    name: "DSPilot Demo",
    organizationId: org.id,
    ownerId: inviterUserId,
  });
  console.log(`  ✓ Station DEMO: ${demoStationId}`);

  const srcDrivers = await convex.query(api.demo.getDIF1DriversForClone, {
    sourceStationId: src._id,
  });

  const driverMap = srcDrivers.map((d: { _id: Id<"drivers">; name: string; amazonId: string }) => ({
    srcId: d._id,
    name: anonymizeDriverName(d.name),
    amazonId: anonymizeAmazonId(d.amazonId),
  }));
  console.log(`  ✓ ${driverMap.length} drivers mapped`);

  const result = await convex.mutation(api.demo.seedDemoStation, {
    sourceStationId: src._id,
    targetStationId: demoStationId,
    driverMap,
    weeksBack: 4,
  });
  console.log(`  ✓ seed: ${JSON.stringify(result)}`);

  console.log(`\n✓ Demo tenant ready. Switch to "DSPilot Demo" in the org switcher.\n`);
}

main().catch((err) => {
  console.error("\n✗ create-demo-tenant failed:");
  console.error(err);
  process.exit(1);
});
