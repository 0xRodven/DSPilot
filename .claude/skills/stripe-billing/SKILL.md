---
name: stripe-billing
description: Implement Stripe billing with usage-based metering, subscriptions, webhooks, and customer portal. Use when adding payment features, subscription management, or billing UI.
allowed-tools: Read, Write, Edit, Bash, WebFetch
---

# Stripe Billing Patterns for DSPilot

## When to Use
- Implementing checkout flows
- Creating subscription management
- Adding usage-based billing (per active driver)
- Handling Stripe webhooks
- Building billing UI components

## DSPilot Billing Model

```
Plans:
- Free: 0€/month, 1 station, 10 drivers max
- Pro: 49€/month, 1 station, 50 drivers max
- Enterprise: 149€/month, unlimited stations, unlimited drivers

Usage-based add-on:
- 25€/driver/month for active drivers above plan limit
```

## Instructions

### 1. Stripe Setup in Convex

```typescript
// convex/stripe.ts
import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Create Stripe customer for organization
export const createCustomer = action({
  args: {
    organizationId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { organizationId, email, name }) => {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { organizationId },
    });

    // Store customer ID in Convex
    await ctx.runMutation(internal.billing.saveCustomerId, {
      organizationId,
      stripeCustomerId: customer.id,
    });

    return customer.id;
  },
});
```

### 2. Checkout Session (Subscriptions)

```typescript
export const createCheckoutSession = action({
  args: {
    organizationId: v.string(),
    priceId: v.string(),  // Stripe Price ID
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(api.organizations.get, {
      id: args.organizationId
    });

    const session = await stripe.checkout.sessions.create({
      customer: org.stripeCustomerId,
      mode: "subscription",
      line_items: [{
        price: args.priceId,
        quantity: 1,
      }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      subscription_data: {
        metadata: { organizationId: args.organizationId },
      },
    });

    return session.url;
  },
});
```

### 3. Usage-Based Metering

```typescript
// Report usage monthly (cron job)
export const reportUsage = internalAction({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.runQuery(internal.billing.getActiveOrgs);

    for (const org of orgs) {
      // Count active drivers this billing period
      const activeDrivers = await ctx.runQuery(
        internal.drivers.countActive,
        { organizationId: org._id }
      );

      // Report to Stripe
      await stripe.subscriptionItems.createUsageRecord(
        org.stripeSubscriptionItemId,
        {
          quantity: activeDrivers,
          timestamp: Math.floor(Date.now() / 1000),
          action: "set", // Replace previous usage
        }
      );
    }
  },
});
```

### 4. Webhook Handler

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature")!;
    const body = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return new Response("Invalid signature", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await ctx.runMutation(internal.billing.activateSubscription, {
          sessionId: event.data.object.id,
        });
        break;

      case "customer.subscription.updated":
        await ctx.runMutation(internal.billing.updateSubscription, {
          subscriptionId: event.data.object.id,
          status: event.data.object.status,
        });
        break;

      case "customer.subscription.deleted":
        await ctx.runMutation(internal.billing.cancelSubscription, {
          subscriptionId: event.data.object.id,
        });
        break;

      case "invoice.payment_failed":
        await ctx.runMutation(internal.billing.handlePaymentFailed, {
          invoiceId: event.data.object.id,
        });
        break;
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

### 5. Customer Portal

```typescript
export const createPortalSession = action({
  args: { organizationId: v.string() },
  handler: async (ctx, { organizationId }) => {
    const org = await ctx.runQuery(api.organizations.get, {
      id: organizationId
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return session.url;
  },
});
```

### 6. Plan Limit Enforcement

```typescript
// convex/lib/billing.ts
export async function checkPlanLimits(
  ctx: QueryCtx,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_organization", q => q.eq("organizationId", organizationId))
    .first();

  if (!subscription || subscription.status !== "active") {
    return { allowed: false, reason: "No active subscription" };
  }

  const plan = PLANS[subscription.planId];

  // Check station limit
  const stationCount = await ctx.db
    .query("stations")
    .withIndex("by_organization", q => q.eq("organizationId", organizationId))
    .collect()
    .then(s => s.length);

  if (plan.maxStations && stationCount >= plan.maxStations) {
    return { allowed: false, reason: "Station limit reached" };
  }

  // Check driver limit
  const driverCount = await ctx.db
    .query("drivers")
    .withIndex("by_organization", q => q.eq("organizationId", organizationId))
    .filter(q => q.eq(q.field("isActive"), true))
    .collect()
    .then(d => d.length);

  if (plan.maxDrivers && driverCount >= plan.maxDrivers) {
    return { allowed: false, reason: "Driver limit reached. Upgrade to add more." };
  }

  return { allowed: true };
}
```

## Schema Addition

```typescript
// Add to convex/schema.ts
subscriptions: defineTable({
  organizationId: v.string(),
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.string(),
  stripeSubscriptionItemId: v.optional(v.string()), // For usage-based
  planId: v.string(), // "free", "pro", "enterprise"
  status: v.string(), // "active", "past_due", "canceled"
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_stripe_subscription", ["stripeSubscriptionId"]),
```

## UI Component Pattern

```tsx
// src/app/(app)/settings/billing/page.tsx
"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function BillingPage() {
  const subscription = useQuery(api.billing.getSubscription);
  const createPortal = useAction(api.stripe.createPortalSession);

  const handleManageBilling = async () => {
    const url = await createPortal({ organizationId: org._id });
    window.location.href = url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-lg font-semibold">{subscription?.planId}</p>
          </div>
          <Button onClick={handleManageBilling}>
            Manage Billing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Environment Variables Needed

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

## Testing
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Test cards: 4242424242424242 (success), 4000000000000002 (decline)
