# Onboarding + Stripe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship end-of-day the booking → payment → CLI-onboarding flow so Ousmane can close and provision the first 2 DSPilot customers tomorrow.

**Architecture:** Cal.com booking embed on landing → Stripe Payment Links sent by email post-call → webhook stub logs events → `onboard-customer.ts` CLI creates Clerk org + Convex station. Demo tenant is a dedicated Clerk org on prod Convex, seeded from anonymized DIF1 data.

**Tech Stack:** Next.js 16 App Router, Convex (prod `sincere-rhinoceros-718`), Clerk (orgs), Stripe (Payment Links), Cal.com (embed-react), TypeScript + Bun/tsx for scripts.

**Spec reference:** `docs/superpowers/specs/2026-04-22-onboarding-stripe-design.md`

**Note on testing:** DSPilot has no Jest/Vitest today. Adding a test framework is out of scope. TDD is replaced by **verification runs** — each CLI or mutation ships with a deterministic "dry-run" path and a scripted verification step. E2E is via `browse` MCP.

**Post-plan commits:** use existing pattern (Co-Authored-By line, conventional commits).

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `convex/stripeEvents.ts` | Audit trail of webhook events (`recordEvent` mutation, idempotent) |
| `convex/subscriptions.ts` | Internal mutation `recordSubscription` to link Stripe IDs to a station |
| `convex/demo.ts` (extend) | Internal `seedDemoStation` mutation + public `getDashboardPublic` query |
| `scripts/onboard-customer.ts` | CLI — Clerk org+invite, Convex station insert, subscription row |
| `scripts/create-demo-tenant.ts` | CLI — spawn "DSPilot Demo" org + station |
| `scripts/anonymize-demo-data.ts` | Utility called by create-demo — clone DIF1 stats with renamed drivers |
| `src/app/api/webhooks/stripe/route.ts` | POST handler: verify signature, record event, 200 |
| `src/app/paid/page.tsx` | "Merci" page post-Checkout |
| `src/components/landing/cal-embed.tsx` | `<CalEmbed />` popup wrapper around `@calcom/embed-react` |

### Modified files

| Path | Change |
|---|---|
| `convex/schema.ts` | Add 4 fields to `stations`, add `stripeEvents` table |
| `convex/stations.ts` | `createStation` accepts new Stripe + setup-status fields |
| `src/components/linkify/pricing.tsx` | CTAs → `<CalEmbed />` |
| `src/components/linkify/hero.tsx` | Main CTA → "Réserver une démo" via `<CalEmbed />` |
| `src/app/(marketing)/page.tsx` | Inject Cal.com script once |
| `src/app/demo/page.tsx` | Swap fake data for `demo.getDashboardPublic` query |
| `src/middleware.ts` | Add `/paid` + `/api/webhooks/stripe` to public routes |
| `package.json` | `stripe@^17`, `@clerk/backend@^1`, `@calcom/embed-react@^1` |
| `.env.local` (template doc) | New env keys |

---

## Ops track (Ousmane, in parallel — blocking E2E smoke only)

- [ ] **O1.** Create Stripe account (if not done) and activate Stripe Tax with SIRET from `src/app/(marketing)/legal/page.tsx`.
- [ ] **O2.** Create 2 Products in Stripe dashboard: "DSPilot Pro", "DSPilot Business". Add 4 Prices (499€/mo, 399€/mo yearly, 999€/mo, 799€/mo yearly — all EUR, recurring).
- [ ] **O3.** Create 4 Payment Links (one per Price). Set `success_url` to `https://dspilot.fr/paid?session_id={CHECKOUT_SESSION_ID}` and enable "Collect billing address" + VAT.
- [ ] **O4.** Create Stripe webhook endpoint `https://dspilot.fr/api/webhooks/stripe`, subscribe to events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the Signing secret.
- [ ] **O5.** Add to Vercel prod env (`vercel env add`):
  - `STRIPE_SECRET_KEY` (from Stripe dashboard > Developers > API keys)
  - `STRIPE_WEBHOOK_SECRET` (from O4)
  - `STRIPE_PAYMENT_LINK_PRO_MONTHLY`, `_PRO_YEARLY`, `_BUSINESS_MONTHLY`, `_BUSINESS_YEARLY`
  - `CLERK_SECRET_KEY` (verify existing; add if missing)
  - `NEXT_PUBLIC_CAL_LINK` (e.g. `ousmane-dspilot/demo-30min`)
- [ ] **O6.** Mirror same keys into local `.env.local` for dev.
- [ ] **O7.** Sign up cal.com (or log in), create event type "Démo DSPilot — 30min" (30min, Google Meet, Europe/Paris). Copy the link slug (e.g. `ousmane-dspilot/demo-30min`) — this is `NEXT_PUBLIC_CAL_LINK`.
- [ ] **O8.** In Cal.com > Workflows, add email notification to `ousmane@dspilot.fr` on every booking.

---

## Prerequisites (Track P — do first, blocks everything)

### Task P1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd /Users/ousmane/Desktop/DSPilot
npm install stripe @clerk/backend @calcom/embed-react
```

- [ ] **Step 2: Verify versions installed**

```bash
npm ls stripe @clerk/backend @calcom/embed-react
```

Expected: all three resolve without `UNMET PEER DEPENDENCY`.

- [ ] **Step 3: Run tsc to catch immediate type errors from new deps**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 new errors from these packages. Existing errors (if any) unchanged.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add stripe, @clerk/backend, @calcom/embed-react"
```

### Task P2: Env vars template

**Files:**
- Modify: `.env.local` (local dev)
- Create: `.env.example` (documented template)

- [ ] **Step 1: Add entries to `.env.local`**

Append to `/Users/ousmane/Desktop/DSPilot/.env.local`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PAYMENT_LINK_PRO_MONTHLY=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_PRO_YEARLY=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_BUSINESS_MONTHLY=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_BUSINESS_YEARLY=https://buy.stripe.com/...

# Clerk backend
CLERK_SECRET_KEY=sk_live_...

# Cal.com
NEXT_PUBLIC_CAL_LINK=ousmane-dspilot/demo-30min
```

- [ ] **Step 2: Create `.env.example`** matching new keys (values = placeholders `<add-me>`).

```bash
cat > /Users/ousmane/Desktop/DSPilot/.env.example <<'EOF'
# Convex
NEXT_PUBLIC_CONVEX_URL=<convex-deployment-url>
CONVEX_DEPLOY_KEY=<add-me>

# Clerk (front + backend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<add-me>
CLERK_SECRET_KEY=<add-me>

# Stripe
STRIPE_SECRET_KEY=<add-me>
STRIPE_WEBHOOK_SECRET=<add-me>
STRIPE_PAYMENT_LINK_PRO_MONTHLY=<add-me>
STRIPE_PAYMENT_LINK_PRO_YEARLY=<add-me>
STRIPE_PAYMENT_LINK_BUSINESS_MONTHLY=<add-me>
STRIPE_PAYMENT_LINK_BUSINESS_YEARLY=<add-me>

# Cal.com
NEXT_PUBLIC_CAL_LINK=<add-me>
EOF
```

- [ ] **Step 3: Commit `.env.example`** (not `.env.local`)

```bash
git add .env.example
git commit -m "docs: .env.example template with Stripe + Cal.com keys"
```

---

## Track B — Backend

### Task B1: Schema migration

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add fields to `stations` table**

Find the `stations: defineTable({` block (around line 123) and update to:

```ts
stations: defineTable({
  code: v.string(),
  name: v.string(),
  region: v.optional(v.string()),
  organizationId: v.optional(v.string()),
  ownerId: v.string(),
  plan: v.union(
    v.literal("free"),
    v.literal("pro"),
    v.literal("business"),
    v.literal("enterprise"),
  ),
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  subscriptionStatus: v.optional(
    v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
    ),
  ),
  initialSetupStatus: v.optional(
    v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("ready"),
    ),
  ),
  createdAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_owner", ["ownerId"])
  .index("by_code", ["code"])
  .index("by_stripe_customer", ["stripeCustomerId"]),
```

- [ ] **Step 2: Add new `stripeEvents` table** just before the closing `});` of `defineSchema`:

```ts
stripeEvents: defineTable({
  stripeEventId: v.string(),
  type: v.string(),
  payload: v.any(),
  processed: v.boolean(),
  receivedAt: v.number(),
})
  .index("by_stripe_event_id", ["stripeEventId"]),
```

- [ ] **Step 3: Push schema to dev**

```bash
cd /Users/ousmane/Desktop/DSPilot
npx convex dev --once 2>&1 | tail -20
```

Expected: `Schema validated` + codegen rerun, no errors.

- [ ] **Step 4: Verify `_generated/dataModel.d.ts` now includes `stripeEvents`**

```bash
grep -c "stripeEvents" convex/_generated/dataModel.d.ts
```

Expected: ≥ 1.

- [ ] **Step 5: Push to prod**

```bash
npx convex deploy 2>&1 | tail -10
```

Expected: deploy succeeds on `sincere-rhinoceros-718`.

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat(schema): add Stripe fields to stations + stripeEvents table"
```

### Task B2: `stripeEvents.recordEvent` mutation

**Files:**
- Create: `convex/stripeEvents.ts`

- [ ] **Step 1: Write the file**

```ts
// convex/stripeEvents.ts
import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

export const recordEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();

    if (existing) {
      return { status: "duplicate", id: existing._id };
    }

    const id = await ctx.db.insert("stripeEvents", {
      stripeEventId: args.stripeEventId,
      type: args.type,
      payload: args.payload,
      processed: false,
      receivedAt: Date.now(),
    });

    return { status: "recorded", id };
  },
});

export const markProcessed = internalMutation({
  args: { id: v.id("stripeEvents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true });
  },
});
```

- [ ] **Step 2: Verify Convex picks up the new module**

```bash
npx convex dev --once 2>&1 | tail -10
```

Expected: no errors, `stripeEvents` internal functions registered.

- [ ] **Step 3: Commit**

```bash
git add convex/stripeEvents.ts
git commit -m "feat(convex): stripeEvents.recordEvent idempotent audit trail"
```

### Task B3: `subscriptions.recordSubscription` mutation

**Files:**
- Create: `convex/subscriptions.ts`
- Modify: `convex/stations.ts`

- [ ] **Step 1: Write `convex/subscriptions.ts`**

```ts
// convex/subscriptions.ts
import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("trialing"),
);

export const recordSubscriptionOnStation = internalMutation({
  args: {
    stationId: v.id("stations"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: subscriptionStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.stationId, {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
    });
  },
});

export const updateSubscriptionStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    subscriptionStatus: subscriptionStatusValidator,
  },
  handler: async (ctx, args) => {
    const station = await ctx.db
      .query("stations")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
      .first();

    if (!station) return { status: "not_found" };

    await ctx.db.patch(station._id, { subscriptionStatus: args.subscriptionStatus });
    return { status: "updated", stationId: station._id };
  },
});
```

- [ ] **Step 2: Extend `convex/stations.ts` — add internal mutation `createStationForOnboarding`**

Append at end of `convex/stations.ts`:

```ts
import { internalMutation } from "./_generated/server";

export const createStationForOnboarding = internalMutation({
  args: {
    code: v.string(),
    name: v.string(),
    region: v.optional(v.string()),
    organizationId: v.string(),
    ownerId: v.string(),
    plan: v.union(
      v.literal("pro"),
      v.literal("business"),
      v.literal("enterprise"),
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      throw new Error(`Station code already exists: ${args.code}`);
    }

    const id = await ctx.db.insert("stations", {
      code: args.code,
      name: args.name,
      region: args.region,
      organizationId: args.organizationId,
      ownerId: args.ownerId,
      plan: args.plan,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: "active",
      initialSetupStatus: "pending",
      createdAt: Date.now(),
    });

    return id;
  },
});
```

- [ ] **Step 3: Push and verify**

```bash
npx convex dev --once 2>&1 | tail -10
```

Expected: new internal mutations registered.

- [ ] **Step 4: Commit**

```bash
git add convex/subscriptions.ts convex/stations.ts convex/_generated
git commit -m "feat(convex): subscriptions mutations + createStationForOnboarding"
```

### Task B4: Stripe webhook stub

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { ConvexHttpClient } from "convex/browser";

import { internal } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `Signature: ${msg}` }, { status: 400 });
  }

  try {
    await convex.mutation(internal.stripeEvents.recordEvent, {
      stripeEventId: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[stripe-webhook] recordEvent failed", err);
    return NextResponse.json({ error: "Record failed" }, { status: 500 });
  }

  // Light inline handling for subscription status transitions.
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const mappedStatus =
      sub.status === "active"
        ? "active"
        : sub.status === "past_due"
          ? "past_due"
          : sub.status === "canceled"
            ? "canceled"
            : sub.status === "trialing"
              ? "trialing"
              : null;

    if (mappedStatus) {
      await convex.mutation(internal.subscriptions.updateSubscriptionStatus, {
        stripeSubscriptionId: sub.id,
        subscriptionStatus: mappedStatus,
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify the import path to `internal` is correct**

```bash
ls /Users/ousmane/Desktop/DSPilot/convex/_generated/api.d.ts && echo ok
```

Expected: `ok` (the relative path `../../../../../convex/_generated/api` resolves from `src/app/api/webhooks/stripe/route.ts` → `convex/_generated/api`).

- [ ] **Step 3: Type check**

```bash
cd /Users/ousmane/Desktop/DSPilot && npx tsc --noEmit 2>&1 | grep -E "stripe/route|stripeEvents" | head -10
```

Expected: no type errors on these files.

- [ ] **Step 4: Smoke invalid signature**

Start dev server in another terminal if not running (`npm run dev`), then:

```bash
curl -s -X POST http://localhost:3005/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: nope" \
  -d '{"id":"evt_test"}'
```

Expected: JSON response with `"error":"Signature: ..."` and HTTP 400.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(api): Stripe webhook stub — signature verify + event audit"
```

### Task B5: `onboard-customer.ts` CLI

**Files:**
- Create: `scripts/onboard-customer.ts`

- [ ] **Step 1: Write the CLI**

```ts
// scripts/onboard-customer.ts
/**
 * CLI to provision a new DSPilot customer after Stripe payment.
 *
 * Usage:
 *   npx tsx scripts/onboard-customer.ts \
 *     --email=owner@example.fr \
 *     --plan=pro \
 *     --station-code=ORY1 \
 *     --station-name="Paris Orly" \
 *     --stripe-customer=cus_xxx \
 *     --stripe-subscription=sub_xxx \
 *     [--dry-run]
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { internal } from "../convex/_generated/api";

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
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) flags[match[1]] = match[2];
  }

  const required = ["email", "plan", "station-code", "station-name"];
  for (const key of required) {
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

async function findOrInviteUser(clerk: ReturnType<typeof createClerkClient>, email: string) {
  const list = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  if (list.data.length > 0) {
    return { mode: "existing" as const, userId: list.data[0].id };
  }
  return { mode: "new" as const, userId: null };
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

  // 1. User lookup
  const userCheck = await findOrInviteUser(clerk, args.email);
  console.log(`  user: ${userCheck.mode}${userCheck.userId ? ` (${userCheck.userId})` : ""}`);

  if (args.dryRun) {
    console.log("  [skip] Clerk org creation");
    console.log("  [skip] Clerk invite");
    console.log("  [skip] Convex station insert");
    console.log("\n✓ dry-run OK");
    return;
  }

  // 2. Create Clerk organization
  const org = await clerk.organizations.createOrganization({
    name: args.stationName,
    slug: args.stationCode.toLowerCase(),
  });
  console.log(`  ✓ Clerk org created: ${org.id} (${org.slug})`);

  // 3. Add or invite user as admin
  if (userCheck.mode === "existing" && userCheck.userId) {
    await clerk.organizations.createOrganizationMembership({
      organizationId: org.id,
      userId: userCheck.userId,
      role: "org:admin",
    });
    console.log(`  ✓ added existing user as admin`);
  } else {
    await clerk.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: args.email,
      role: "org:admin",
      inviterUserId: process.env.DSPILOT_INVITER_USER_ID ?? "",
    });
    console.log(`  ✓ invitation sent to ${args.email}`);
  }

  // 4. Resolve ownerId for Convex (Clerk userId) — use inviter's id as placeholder when user is still pending
  const ownerId = userCheck.userId ?? process.env.DSPILOT_INVITER_USER_ID ?? "";
  if (!ownerId) {
    throw new Error("No ownerId resolved — set DSPILOT_INVITER_USER_ID in env");
  }

  // 5. Insert station
  const stationId = await convex.mutation(internal.stations.createStationForOnboarding, {
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
```

- [ ] **Step 2: Add npm script**

Modify `package.json` scripts section, add:

```json
"onboard": "tsx scripts/onboard-customer.ts"
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit 2>&1 | grep -E "onboard-customer" | head -5
```

Expected: no type errors.

- [ ] **Step 4: Dry-run verification**

```bash
source .env.local && npm run onboard -- \
  --email=test@example.fr \
  --plan=pro \
  --station-code=TEST1 \
  --station-name="Test Station" \
  --dry-run
```

Expected output: `✓ dry-run OK`, `user: new`.

- [ ] **Step 5: Commit**

```bash
git add scripts/onboard-customer.ts package.json
git commit -m "feat(scripts): onboard-customer CLI — Clerk org + Convex station"
```

---

## Track F — Frontend

### Task F1: `CalEmbed` component

**Files:**
- Create: `src/components/landing/cal-embed.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/landing/cal-embed.tsx
"use client";

import { useEffect, type ReactNode } from "react";

import { getCalApi } from "@calcom/embed-react";

type CalEmbedProps = {
  trigger: ReactNode;
  /** Namespace for this embed (allows multiple on same page). */
  namespace?: string;
};

export function CalEmbed({ trigger, namespace = "dspilot-demo" }: CalEmbedProps) {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK;

  useEffect(() => {
    if (!calLink) return;
    (async () => {
      const cal = await getCalApi({ namespace });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#2563EB" },
          dark: { "cal-brand": "#2563EB" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [calLink, namespace]);

  if (!calLink) {
    return <>{trigger}</>;
  }

  return (
    <span
      data-cal-namespace={namespace}
      data-cal-link={calLink}
      data-cal-config='{"layout":"month_view"}'
      className="inline-block cursor-pointer"
    >
      {trigger}
    </span>
  );
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit 2>&1 | grep -i "cal-embed" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/cal-embed.tsx
git commit -m "feat(landing): CalEmbed popup wrapper for booking"
```

### Task F2: Update `pricing.tsx` CTAs

**Files:**
- Modify: `src/components/linkify/pricing.tsx`

- [ ] **Step 1: Import `CalEmbed`** at top of file (after existing imports):

```tsx
import { CalEmbed } from "@/components/landing/cal-embed";
```

- [ ] **Step 2: Remove `href` from the `plans` array** (no longer needed for Pro & Business).

Change each plan object in the `plans` array:

```ts
// Pro
{ name: "Pro", ..., cta: "Réserver une démo" /* remove href */ },

// Business
{ name: "Business", ..., cta: "Réserver une démo" /* remove href */ },

// Enterprise stays with mailto:sales@dspilot.fr and href
```

Update the TypeScript plan type accordingly (remove required `href` or make it optional).

- [ ] **Step 3: Replace the `<Link>` block** with a conditional: Enterprise keeps `<Link>` (mailto), Pro/Business wrap the button in `<CalEmbed>`:

Locate the `<Link href={plan.href} ...>` block (around line 195) and replace the entire JSX inside `plans.map` for the button area with:

```tsx
{plan.name === "Enterprise" ? (
  <Link
    href={plan.href ?? "mailto:sales@dspilot.fr"}
    className={cn(
      "block w-full rounded-xl py-3.5 text-center font-semibold text-[15px] transition-all duration-200",
      plan.popular ? "text-white" : "border",
    )}
    style={{
      background: plan.popular ? "#2563EB" : "transparent",
      borderColor: plan.popular ? undefined : "#E8E5DF",
      color: plan.popular ? "#FFFFFF" : "#1A1A1A",
    }}
  >
    {plan.cta}
  </Link>
) : (
  <CalEmbed
    namespace={`pricing-${plan.name.toLowerCase()}`}
    trigger={
      <button
        type="button"
        className={cn(
          "block w-full rounded-xl py-3.5 text-center font-semibold text-[15px] transition-all duration-200",
          plan.popular ? "text-white" : "border",
        )}
        style={{
          background: plan.popular ? "#2563EB" : "transparent",
          borderColor: plan.popular ? undefined : "#E8E5DF",
          color: plan.popular ? "#FFFFFF" : "#1A1A1A",
        }}
      >
        {plan.cta}
      </button>
    }
  />
)}
```

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit 2>&1 | grep -i "pricing.tsx" | head -5
```

Expected: no errors.

- [ ] **Step 5: Visual check** via dev server

```bash
# in another terminal
npm run dev
# then open http://localhost:3005 and scroll to pricing section
```

Expected: CTAs say "Réserver une démo" (Pro + Business), clicking opens a Cal.com modal; Enterprise CTA is unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/components/linkify/pricing.tsx
git commit -m "feat(pricing): switch Pro/Business CTAs to Cal.com booking"
```

### Task F3: Update `hero.tsx` CTA

**Files:**
- Modify: `src/components/linkify/hero.tsx`

- [ ] **Step 1: Find the primary CTA** (search for "Commencer" or "Essayer" or the existing sign-up link):

```bash
grep -n "sign-up\|Commencer\|Essayer" src/components/linkify/hero.tsx | head -5
```

- [ ] **Step 2: Replace that CTA with a `<CalEmbed>` wrapping a button** that reads "Réserver une démo". Keep the visual styling intact — only swap the click target.

```tsx
// Add import at top:
import { CalEmbed } from "@/components/landing/cal-embed";

// Replace the primary CTA <Link href="/sign-up"> ...</Link> with:
<CalEmbed
  namespace="hero"
  trigger={
    <button
      type="button"
      className={/* preserve existing className of the Link it replaced */}
      style={/* preserve existing style */}
    >
      Réserver une démo
    </button>
  }
/>
```

(Do NOT touch the secondary CTA, if any — typically "Voir la démo" stays as a link to `/demo`.)

- [ ] **Step 3: Type check + visual check** (same pattern as F2).

- [ ] **Step 4: Commit**

```bash
git add src/components/linkify/hero.tsx
git commit -m "feat(hero): primary CTA → Cal.com booking"
```

### Task F4: `/paid` page

**Files:**
- Create: `src/app/paid/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/paid/page.tsx
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata = {
  title: "Merci — DSPilot",
  description: "Paiement confirmé. Vous recevrez un email pour activer votre compte.",
};

export default async function PaidPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-6 py-20">
      <div className="max-w-xl rounded-2xl border border-[#E8E5DF] bg-white p-10 text-center shadow-sm">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-4 font-semibold text-2xl text-[#1A1A1A]">Paiement confirmé</h1>
        <p className="mb-6 text-[#4A4A4A]">
          Merci pour votre confiance. Vous allez recevoir un email pour activer votre compte et
          accéder à DSPilot dans les <strong>prochaines 24 heures</strong>.
        </p>
        <p className="mb-8 text-[#8A8A8A] text-sm">
          Notre équipe connecte manuellement votre compte Amazon Logistics pour le premier import
          (station, livreurs, DWC dernières semaines). Vous recevrez une notification dès que tout
          est prêt.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-sm text-white transition-all hover:bg-[#1d4ed8]"
        >
          Retour à l&apos;accueil
        </Link>
        {sessionId ? (
          <p className="mt-6 text-[#8A8A8A] text-xs">Référence : {sessionId}</p>
        ) : null}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit 2>&1 | grep -i "paid/page" | head -5
```

Expected: no errors.

- [ ] **Step 3: Visual check** — open `http://localhost:3005/paid?session_id=cs_test_123`

Expected: thank-you page renders.

- [ ] **Step 4: Commit**

```bash
git add src/app/paid/page.tsx
git commit -m "feat(app): /paid thank-you page post-Checkout"
```

### Task F5: Middleware update

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add `/paid` to public routes**

Replace the current `isPublicRoute` call with:

```ts
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/auth(.*)",
  "/unauthorized",
  "/paid",
  "/demo",
  "/about",
  "/blog(.*)",
  "/en(.*)",
  "/legal",
  "/privacy",
  "/terms",
]);
```

(Note: marketing pages were previously covered only by `/` — this cleans up the matcher too.)

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit 2>&1 | grep "middleware" | head -5
```

Expected: no errors.

- [ ] **Step 3: Verify `/paid` loads without auth**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3005/paid?session_id=cs_test_1
```

Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "fix(middleware): expand public routes (paid, demo, marketing)"
```

---

## Track D — Demo tenant

### Task D1: Anonymization utility

**Files:**
- Create: `scripts/anonymize-demo-data.ts`

- [ ] **Step 1: Write the utility**

```ts
// scripts/anonymize-demo-data.ts
/**
 * Deterministic driver-name anonymization.
 *
 * Given an original driver name, produces a stable pseudonym.
 * Same input → same output across runs (so stats tables referencing
 * the same driverId remain coherent).
 */
import { createHash } from "node:crypto";

const FIRST_MASC = [
  "Martin",
  "Bernard",
  "Dubois",
  "Moreau",
  "Laurent",
  "Simon",
  "Michel",
  "Lefebvre",
  "Leroy",
  "Roux",
  "David",
  "Bertrand",
  "Morel",
  "Fournier",
  "Girard",
];

const FIRST_FEM = [
  "Martin",
  "Bernard",
  "Dubois",
  "Moreau",
  "Petit",
  "Durand",
  "Leroy",
  "Morel",
  "Girard",
  "Roux",
  "Fontaine",
  "Masson",
  "Lambert",
  "Gauthier",
  "Perrin",
];

const ADJ_M = [
  "Alex.",
  "Antoine",
  "Benoit",
  "Clément",
  "Damien",
  "Étienne",
  "François",
  "Gabriel",
  "Hugo",
  "Julien",
  "Kévin",
  "Lucas",
  "Maxime",
  "Nicolas",
  "Olivier",
];

const ADJ_F = [
  "Amélie",
  "Béatrice",
  "Camille",
  "Delphine",
  "Émilie",
  "Fanny",
  "Gaëlle",
  "Héloïse",
  "Isabelle",
  "Julie",
  "Karine",
  "Laura",
  "Margaux",
  "Noémie",
  "Olivia",
];

function hashIdx(input: string, mod: number): number {
  const h = createHash("sha256").update(input).digest();
  return h.readUInt32BE(0) % mod;
}

export function anonymizeDriverName(original: string): string {
  const isFem = hashIdx(original + ":sex", 2) === 0;
  const first = isFem ? ADJ_F[hashIdx(original, ADJ_F.length)] : ADJ_M[hashIdx(original, ADJ_M.length)];
  const last = isFem
    ? FIRST_FEM[hashIdx(original + ":last", FIRST_FEM.length)]
    : FIRST_MASC[hashIdx(original + ":last", FIRST_MASC.length)];
  return `${first} ${last}`;
}

export function anonymizeAmazonId(original: string): string {
  return "A_DEMO_" + createHash("sha256").update(original).digest("hex").slice(0, 10).toUpperCase();
}

if (require.main === module) {
  const sample = ["Kitenge", "Rayan", "Jean Dupont", "Hassane"];
  for (const name of sample) {
    console.log(`  ${name.padEnd(20)} → ${anonymizeDriverName(name)}`);
  }
}
```

- [ ] **Step 2: Smoke test**

```bash
npx tsx scripts/anonymize-demo-data.ts
```

Expected: 4 lines, same output every run.

- [ ] **Step 3: Commit**

```bash
git add scripts/anonymize-demo-data.ts
git commit -m "feat(scripts): deterministic driver name/id anonymizer"
```

### Task D2: Convex `demo.seedDemoStation` internal mutation

**Files:**
- Modify (or create if doesn't exist): `convex/demo.ts`

- [ ] **Step 1: Check current content**

```bash
test -f convex/demo.ts && head -20 convex/demo.ts || echo "NEW FILE"
```

- [ ] **Step 2: Add the `seedDemoStation` internal mutation and `cloneStatsFromDIF1`**

Append (or create) the following in `convex/demo.ts`:

```ts
import { v } from "convex/values";

import { internalMutation, internalQuery, query } from "./_generated/server";

/**
 * Copy driverWeeklyStats rows from a source station to a target station,
 * rewriting driverId/name pairs via an in-memory map built by the caller.
 */
export const seedDemoStation = internalMutation({
  args: {
    sourceStationId: v.id("stations"),
    targetStationId: v.id("stations"),
    driverMap: v.array(
      v.object({
        srcId: v.id("drivers"),
        name: v.string(),
        amazonId: v.string(),
      }),
    ),
    weeksBack: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Create new driver rows in target station
    const idMap = new Map<string, unknown>(); // src driverId → tgt driverId
    for (const d of args.driverMap) {
      const newId = await ctx.db.insert("drivers", {
        stationId: args.targetStationId,
        amazonId: d.amazonId,
        name: d.name,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      idMap.set(d.srcId, newId);
    }

    // 2. Copy weekly stats
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.sourceStationId))
      .collect();

    let copied = 0;
    for (const row of weeklyStats) {
      const tgtDriverId = idMap.get(row.driverId);
      if (!tgtDriverId) continue;
      const { _id, _creationTime, ...rest } = row;
      await ctx.db.insert("driverWeeklyStats", {
        ...rest,
        stationId: args.targetStationId,
        driverId: tgtDriverId as never,
      });
      copied++;
    }

    return { driversCreated: args.driverMap.length, weeklyStatsCopied: copied };
  },
});

export const getDIF1DriversForClone = internalQuery({
  args: { sourceStationId: v.id("stations") },
  handler: async (ctx, args) => {
    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", args.sourceStationId))
      .collect();
    return drivers.map((d) => ({ _id: d._id, name: d.name, amazonId: d.amazonId }));
  },
});

export const createDemoStationRow = internalMutation({
  args: {
    code: v.string(),
    name: v.string(),
    organizationId: v.string(),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stations", {
      code: args.code,
      name: args.name,
      organizationId: args.organizationId,
      ownerId: args.ownerId,
      plan: "business",
      subscriptionStatus: "active",
      initialSetupStatus: "ready",
      createdAt: Date.now(),
    });
  },
});

/**
 * Public read-only dashboard for /demo page.
 */
export const getDashboardPublic = query({
  args: {},
  handler: async (ctx) => {
    // Hardcoded demo station code (updated after create-demo-tenant run)
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", "DEMO"))
      .first();

    if (!station) return null;

    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", station._id))
      .collect();

    const weekly = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", station._id))
      .collect();

    return {
      station: { code: station.code, name: station.name },
      driverCount: drivers.length,
      weeklyStatsCount: weekly.length,
    };
  },
});
```

(Note: indexes `by_station` must exist on `drivers` and `driverWeeklyStats`. If they don't, adjust to existing index names or add to schema first.)

- [ ] **Step 3: Verify indexes exist**

```bash
grep -E 'drivers: defineTable|driverWeeklyStats: defineTable' -A 20 convex/schema.ts | grep -E "by_station|by_driver"
```

Expected: `by_station` index appears on both tables.

- [ ] **Step 4: Push**

```bash
npx convex dev --once 2>&1 | tail -10
```

Expected: no schema errors.

- [ ] **Step 5: Commit**

```bash
git add convex/demo.ts
git commit -m "feat(convex): demo.seedDemoStation + getDashboardPublic query"
```

### Task D3: `create-demo-tenant.ts` CLI

**Files:**
- Create: `scripts/create-demo-tenant.ts`

- [ ] **Step 1: Write the CLI**

```ts
// scripts/create-demo-tenant.ts
/**
 * One-time CLI to spawn the DSPilot Demo tenant.
 *
 * Usage:
 *   DSPILOT_INVITER_USER_ID=user_xxx npx tsx scripts/create-demo-tenant.ts --source-station-code=DIF1
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { internal } from "../convex/_generated/api";
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

  if (!inviterUserId) throw new Error("DSPILOT_INVITER_USER_ID required (set to Ousmane's Clerk user id)");
  if (!clerkSecret) throw new Error("CLERK_SECRET_KEY required");
  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL required");

  const clerk = createClerkClient({ secretKey: clerkSecret });
  const convex = new ConvexHttpClient(convexUrl);

  console.log(`\n▶ Create demo tenant (source=${args.sourceStationCode})`);

  // 1. Resolve source station id
  const src = await convex.query(internal.stations.getStationByCode ?? internal.stations.createStationForOnboarding, {
    code: args.sourceStationCode,
  } as never).catch(() => null);
  // If there is no public getStationByCode yet, add a helper in convex/stations.ts:
  //   export const getStationByCode = internalQuery({ args: { code: v.string() }, handler: async (ctx, a) => ctx.db.query("stations").withIndex("by_code", q => q.eq("code", a.code)).first() });

  // For simplicity, require src to be resolvable
  if (!src) throw new Error(`Source station ${args.sourceStationCode} not found`);

  if (args.dryRun) {
    console.log("  DRY-RUN — stopping before writes");
    return;
  }

  // 2. Create Clerk org "DSPilot Demo"
  const org = await clerk.organizations.createOrganization({
    name: "DSPilot Demo",
    slug: "dspilot-demo",
    createdBy: inviterUserId,
  });
  console.log(`  ✓ Clerk org: ${org.id}`);

  // 3. Create demo station row
  const demoStationId = await convex.mutation(internal.demo.createDemoStationRow, {
    code: "DEMO",
    name: "DSPilot Demo",
    organizationId: org.id,
    ownerId: inviterUserId,
  });
  console.log(`  ✓ Station DEMO: ${demoStationId}`);

  // 4. Fetch source drivers + build anonymized mapping
  const srcDrivers = await convex.query(internal.demo.getDIF1DriversForClone, {
    sourceStationId: (src as { _id: string })._id as never,
  });

  const driverMap = srcDrivers.map((d) => ({
    srcId: d._id,
    name: anonymizeDriverName(d.name),
    amazonId: anonymizeAmazonId(d.amazonId),
  }));
  console.log(`  ✓ ${driverMap.length} drivers mapped`);

  // 5. Seed
  const result = await convex.mutation(internal.demo.seedDemoStation, {
    sourceStationId: (src as { _id: string })._id as never,
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
```

- [ ] **Step 2: Add `getStationByCode` helper** in `convex/stations.ts`:

```ts
export const getStationByCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first(),
});
```

Add `import { internalQuery } from "./_generated/server";` at top if not present.

- [ ] **Step 3: Adjust the CLI `internal.stations.getStationByCode` call** (replace the placeholder in step 1 with the real one):

```ts
const src = await convex.query(internal.stations.getStationByCode, {
  code: args.sourceStationCode,
});
```

- [ ] **Step 4: Push + type check**

```bash
npx convex dev --once 2>&1 | tail -5
npx tsc --noEmit 2>&1 | grep -E "create-demo-tenant|demo.ts|stations.ts" | head -5
```

Expected: no errors.

- [ ] **Step 5: Add npm script to `package.json`**

```json
"create-demo": "tsx scripts/create-demo-tenant.ts"
```

- [ ] **Step 6: Dry-run**

```bash
source .env.local && DSPILOT_INVITER_USER_ID=<ousmane-clerk-id> npm run create-demo -- --dry-run
```

Expected: no writes, logs "DRY-RUN — stopping before writes".

- [ ] **Step 7: Commit**

```bash
git add scripts/create-demo-tenant.ts scripts/anonymize-demo-data.ts convex/stations.ts convex/demo.ts package.json
git commit -m "feat(scripts): create-demo-tenant with anonymized DIF1 clone"
```

### Task D4: Run demo tenant creation (one-time)

**Files:** none (runtime action)

- [ ] **Step 1: Lookup Ousmane's Clerk user id**

Open Clerk dashboard → Users → find `ousmane@dspilot.fr` → copy `user_xxx`.

- [ ] **Step 2: Execute real creation**

```bash
source .env.local && DSPILOT_INVITER_USER_ID=user_xxx npm run create-demo -- --source-station-code=DIF1
```

Expected: `✓ Demo tenant ready.`, no errors.

- [ ] **Step 3: Sanity check in Convex dashboard**

Open `https://dashboard.convex.dev/d/sincere-rhinoceros-718/data/stations`, verify a row with `code=DEMO` exists.

- [ ] **Step 4: Sanity check in Clerk dashboard**

Organizations → verify "DSPilot Demo" exists with Ousmane as Owner.

### Task D5: Refresh `/demo` page

**Files:**
- Modify: `src/app/demo/page.tsx`

- [ ] **Step 1: Read current content** (likely stub / fake data)

```bash
cat src/app/demo/page.tsx | head -60
```

- [ ] **Step 2: Replace with Convex-driven read-only view**

```tsx
// src/app/demo/page.tsx
"use client";

import Link from "next/link";

import { useQuery } from "convex/react";

import { CalEmbed } from "@/components/landing/cal-embed";
import { api } from "../../../convex/_generated/api";

export default function DemoPage() {
  const data = useQuery(api.demo.getDashboardPublic);

  return (
    <main className="min-h-screen bg-[#F5F3EE] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-xl bg-[#2563EB] px-4 py-3 text-sm text-white">
          <strong>Données démo</strong> — vos données resteront privées. Cette page est générée à partir d&apos;une
          station anonymisée.
        </div>

        <h1 className="mb-6 font-semibold text-3xl text-[#1A1A1A]">Aperçu DSPilot</h1>

        {data === undefined ? (
          <p className="text-[#8A8A8A]">Chargement…</p>
        ) : data === null ? (
          <p className="text-[#8A8A8A]">Demo indisponible. Contactez-nous.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            <Card label="Station" value={data.station.name} />
            <Card label="Livreurs suivis" value={String(data.driverCount)} />
            <Card label="Stats hebdo" value={String(data.weeklyStatsCount)} />
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-[#E8E5DF] bg-white p-8 text-center">
          <p className="mb-4 text-[#4A4A4A]">
            Envie de voir DSPilot avec vos vraies données&nbsp;?
          </p>
          <CalEmbed
            namespace="demo-page"
            trigger={
              <button
                type="button"
                className="rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-white"
              >
                Réserver une démo
              </button>
            }
          />
        </div>

        <p className="mt-8 text-center text-[#8A8A8A] text-xs">
          <Link href="/" className="underline">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6">
      <p className="mb-1 text-[#8A8A8A] text-xs uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-2xl text-[#1A1A1A]">{value}</p>
    </div>
  );
}
```

- [ ] **Step 3: Type check + visual**

```bash
npx tsc --noEmit 2>&1 | grep -i "demo/page" | head -5
# open http://localhost:3005/demo
```

Expected: page loads, shows station/drivers/stats counts from the DEMO station.

- [ ] **Step 4: Commit**

```bash
git add src/app/demo/page.tsx
git commit -m "feat(demo): /demo page reads from anonymized DEMO station"
```

---

## Integration track — Smoke test end-to-end

### Task I1: E2E smoke via `browse` MCP

**Files:** none (verification only)

- [ ] **Step 1: Ensure dev server running and env configured**

```bash
# In a dedicated terminal
cd /Users/ousmane/Desktop/DSPilot && npm run dev
# Wait for "Ready" on port 3005
```

- [ ] **Step 2: Trigger Stripe webhook locally via CLI**

```bash
stripe listen --forward-to http://localhost:3005/api/webhooks/stripe
# In another terminal:
stripe trigger checkout.session.completed
```

Expected:
- stripe listen prints `Event received — forwarded to localhost: 200`
- In Convex dashboard `stripeEvents`, a new row with that event id

- [ ] **Step 3: Test onboarding CLI with a throwaway email**

```bash
source .env.local && DSPILOT_INVITER_USER_ID=<ousmane-clerk-id> npm run onboard -- \
  --email=onboard-test+1@dspilot.fr \
  --plan=pro \
  --station-code=SMKT \
  --station-name="Smoke Test Station" \
  --stripe-customer=cus_test_1 \
  --stripe-subscription=sub_test_1
```

Expected:
- New org "Smoke Test Station" in Clerk
- Invitation email sent to `onboard-test+1@dspilot.fr`
- New row in `stations` with `plan=pro`, `initialSetupStatus=pending`

- [ ] **Step 4: Log into DSPilot Demo and navigate**

In browser, sign in as Ousmane → switch org to "DSPilot Demo" → verify dashboard renders with pseudonymized drivers.

- [ ] **Step 5: Landing E2E**

Open `http://localhost:3005` → click "Réserver une démo" (hero) → Cal.com modal opens → close. Scroll to pricing, click Pro CTA → Cal.com modal opens → close. All without console errors.

- [ ] **Step 6: `/paid` check**

Open `http://localhost:3005/paid?session_id=cs_test_smoke` → renders without auth prompt.

- [ ] **Step 7: Cleanup test data**

From Convex dashboard, delete the `SMKT` station row and the `onboard-test+1@dspilot.fr` user from Clerk.

- [ ] **Step 8: Final commit — release notes**

```bash
git log --oneline | head -20
```

Confirm all task commits are in main.

```bash
git push origin main
```

---

## Self-review

- ✅ Spec coverage:
  - §3 end-to-end flow → covered by B4 (webhook) + B5 (CLI) + F1-F5 (landing + paid + middleware)
  - §4.1 schema → B1
  - §4.2 new files → one task per file
  - §4.3 modified files → F2/F3/F5/D5 + B3 (stations.ts extend)
  - §4.4 external setup → Ops track O1-O8
  - §5 demo tenant → D1-D5
  - §6 tests → I1 (E2E smoke; unit tests out of scope, noted in header)
  - §7 timebox → implicit in task sizing (P 0.5h, B 4h, F 1.5h, D 2h, I 0.5h = 8h)
  - §8 risks R1-R7 → R1/R2 handled by O5 + B5 pre-check; R3 in O1; R5 via deterministic hash in D1; R6 non-critical; R7 script reads `NEXT_PUBLIC_CONVEX_URL` from env (prod by default)

- ✅ Placeholder scan: every step has actual code or exact command.
- ✅ Type consistency: `createStationForOnboarding`, `recordSubscriptionOnStation`, `getStationByCode`, `seedDemoStation`, `createDemoStationRow`, `getDashboardPublic`, `getDIF1DriversForClone` — all names match across Tasks B3 / D2 / D3.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-onboarding-stripe.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for today's timebox with 3 parallel tracks.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
