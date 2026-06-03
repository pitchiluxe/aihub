import { NextRequest, NextResponse } from "next/server";
import { upsertSubscription } from "@/lib/stripe-db";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  try {
    // Retrieve the checkout session from Stripe
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription&expand[]=customer`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("[validate-stripe-session]", err);
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const session = await res.json();

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

    const customerId = typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

    const email = session.customer_details?.email
      ?? (typeof session.customer === "object" ? session.customer?.email : undefined);

    if (!subscriptionId || !customerId) {
      // Payment Link without subscription (one-time payment) — grant 30 days
      return NextResponse.json({
        subscriptionId: null,
        customerId,
        email,
        expiresAt: Date.now() + THIRTY_DAYS_MS,
      });
    }

    // Get subscription period end for accurate expiry
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const sub = subRes.ok ? await subRes.json() : null;
    const periodEnd = sub?.current_period_end
      ? sub.current_period_end * 1000
      : Date.now() + THIRTY_DAYS_MS;

    // Persist to DB so webhook cancellations can look it up
    await upsertSubscription({
      subscriptionId,
      customerId,
      email,
      status: "active",
      expiresAt: new Date(periodEnd),
    });

    return NextResponse.json({
      subscriptionId,
      customerId,
      email,
      expiresAt: periodEnd,
    });
  } catch (err) {
    console.error("[validate-stripe-session]", err);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
