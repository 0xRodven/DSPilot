import { type NextRequest, NextResponse } from "next/server";

import { ConvexHttpClient } from "convex/browser";
import Stripe from "stripe";

import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
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
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `Signature: ${msg}` }, { status: 400 });
  }

  try {
    await convex.mutation(api.stripeEvents.recordEvent, {
      stripeEventId: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[stripe-webhook] recordEvent failed", err);
    return NextResponse.json({ error: "Record failed" }, { status: 500 });
  }

  // Light inline handling for subscription status transitions.
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
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
      await convex.mutation(api.subscriptions.updateSubscriptionStatus, {
        stripeSubscriptionId: sub.id,
        subscriptionStatus: mappedStatus,
      });
    }
  }

  return NextResponse.json({ received: true });
}
