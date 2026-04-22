/**
 * CLI to provision a new DSPilot customer after Stripe payment.
 *
 * Usage:
 *   npm run onboard -- \
 *     --email=owner@example.fr \
 *     --plan=pro \
 *     --station-code=ORY1 \
 *     --station-name="Paris Orly" \
 *     --stripe-customer=cus_xxx \
 *     --stripe-subscription=sub_xxx \
 *     [--dry-run]
 *
 * Required env: CLERK_SECRET_KEY, NEXT_PUBLIC_CONVEX_URL, DSPILOT_INVITER_USER_ID
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";

type Args = {
  email: string;
  plan: "pro" | "business" | "enterprise";
  stationCode: string;
  stationName: string;
  stripeCustomer?: string;
  stripeSubscription?: string;
  region?: string;
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
  for (const key of ["email", "plan", "station-code", "station-name"]) {
    if (!flags[key]) throw new Error(`Missing --${key}`);
  }
  if (!["pro", "business", "enterprise"].includes(flags.plan)) {
    throw new Error(`Invalid --plan: ${flags.plan}`);
  }
  return {
    email: flags.email,
    plan: flags.plan as Args["plan"],
    stationCode: flags["station-code"],
    stationName: flags["station-name"],
    stripeCustomer: flags["stripe-customer"],
    stripeSubscription: flags["stripe-subscription"],
    region: flags.region,
    dryRun,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!clerkSecret) throw new Error("Missing CLERK_SECRET_KEY");
  if (!convexUrl) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");

  const clerk = createClerkClient({ secretKey: clerkSecret });
  const convex = new ConvexHttpClient(convexUrl);

  console.log(`\n▶ Onboarding ${args.email} as ${args.plan} for ${args.stationCode}`);
  if (args.dryRun) console.log("  DRY-RUN MODE — no writes");

  const list = await clerk.users.getUserList({ emailAddress: [args.email], limit: 1 });
  const existingUserId = list.data.length > 0 ? list.data[0].id : null;
  console.log(`  user: ${existingUserId ? `existing (${existingUserId})` : "new"}`);

  if (args.dryRun) {
    console.log("  [skip] Clerk org creation");
    console.log("  [skip] Clerk invite");
    console.log("  [skip] Convex station insert");
    console.log("\n✓ dry-run OK");
    return;
  }

  const inviterUserId = process.env.DSPILOT_INVITER_USER_ID;
  if (!inviterUserId) throw new Error("Missing DSPILOT_INVITER_USER_ID");

  const org = await clerk.organizations.createOrganization({
    name: args.stationName,
    createdBy: inviterUserId,
  });
  console.log(`  ✓ Clerk org created: ${org.id}`);

  if (existingUserId) {
    await clerk.organizations.createOrganizationMembership({
      organizationId: org.id,
      userId: existingUserId,
      role: "org:admin",
    });
    console.log(`  ✓ added existing user as admin`);
  } else {
    await clerk.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: args.email,
      role: "org:admin",
      inviterUserId,
    });
    console.log(`  ✓ invitation sent to ${args.email}`);
  }

  // For newly-invited users, use inviter as temporary owner until they accept;
  // later we'll reassign ownership via a Clerk webhook (post-invitation flow).
  const ownerId = existingUserId ?? inviterUserId;

  const stationId = await convex.mutation(api.stations.createStationForOnboarding, {
    code: args.stationCode,
    name: args.stationName,
    region: args.region,
    organizationId: org.id,
    ownerId,
    plan: args.plan,
    stripeCustomerId: args.stripeCustomer,
    stripeSubscriptionId: args.stripeSubscription,
  });
  console.log(`  ✓ Convex station inserted: ${stationId}`);

  console.log(`\n✓ ${args.email} onboarded. They will receive a Clerk invitation.\n`);
}

main().catch((err) => {
  console.error("\n✗ Onboarding failed:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
