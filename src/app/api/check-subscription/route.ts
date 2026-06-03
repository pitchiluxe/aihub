import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/stripe-db";

export async function GET(req: NextRequest) {
  const subscriptionId = new URL(req.url).searchParams.get("id");
  if (!subscriptionId) return NextResponse.json({ active: false, reason: "no_id" });

  try {
    const status = await getSubscriptionStatus(subscriptionId);

    // not_found means webhook hasn't fired yet — give benefit of the doubt
    const active = status === "active" || status === "not_found";

    return NextResponse.json({ active, status });
  } catch (err) {
    console.error("[check-subscription]", err);
    // On DB error, allow access rather than wrongly locking out a paying customer
    return NextResponse.json({ active: true, status: "unknown" });
  }
}
