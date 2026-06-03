import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { upsertSubscription } from "@/lib/stripe-db";

// Verify the request genuinely came from Stripe
function verifySignature(payload: string, header: string, secret: string): boolean {
  const parts = header.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) return false;

  // Reject if timestamp is more than 5 minutes old (replay protection)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return expected === v1;
}

async function getStripeSubscription(subscriptionId: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body   = await req.text();
  const header = req.headers.get("stripe-signature") ?? "";

  if (!verifySignature(body, header, secret)) {
    console.warn("[stripe-webhook] Invalid signature — possible spoofed request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const obj   = event.data?.object;

  try {
    switch (event.type) {
      // ── Subscription activated / renewed ────────────────────────────────
      case "customer.subscription.created":
      case "invoice.payment_succeeded": {
        const subId = obj.subscription ?? obj.id;
        if (!subId) break;

        const sub = await getStripeSubscription(subId);
        if (!sub) break;

        // current_period_end is when this billing period ends
        const expiresAt = new Date((sub.current_period_end ?? 0) * 1000);

        await upsertSubscription({
          subscriptionId: sub.id,
          customerId:     sub.customer,
          status:         "active",
          expiresAt,
        });
        console.log(`[stripe-webhook] Activated: ${sub.id} → expires ${expiresAt.toISOString()}`);
        break;
      }

      // ── Subscription cancelled by customer ──────────────────────────────
      case "customer.subscription.deleted": {
        const subId = obj.id;
        if (!subId) break;

        await upsertSubscription({
          subscriptionId: subId,
          customerId:     obj.customer,
          status:         "cancelled",
        });
        console.log(`[stripe-webhook] Cancelled: ${subId}`);
        break;
      }

      // ── Payment failed (card declined, expired, etc.) ───────────────────
      case "invoice.payment_failed": {
        const subId = obj.subscription;
        if (!subId) break;

        await upsertSubscription({
          subscriptionId: subId,
          customerId:     obj.customer,
          status:         "past_due",
        });
        console.log(`[stripe-webhook] Payment failed: ${subId}`);
        break;
      }

      // ── Subscription updated (e.g. reactivated after past_due) ──────────
      case "customer.subscription.updated": {
        const subId = obj.id;
        if (!subId) break;

        const status = obj.status === "active" ? "active"
          : obj.status === "canceled" ? "cancelled"
          : "past_due";

        const expiresAt = obj.current_period_end
          ? new Date(obj.current_period_end * 1000)
          : undefined;

        await upsertSubscription({
          subscriptionId: subId,
          customerId:     obj.customer,
          status,
          expiresAt,
        });
        console.log(`[stripe-webhook] Updated: ${subId} → ${status}`);
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
