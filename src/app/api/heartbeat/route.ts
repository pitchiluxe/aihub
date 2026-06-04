import { NextRequest, NextResponse } from "next/server";
import { initAnalytics, upsertPresence, recordPageView, getOnlineCount } from "@/lib/db";

export const dynamic = "force-dynamic";

let analyticsReady = false;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, page, deviceType } = await req.json();
    if (!sessionId) return NextResponse.json({ online: 1 }, { status: 400 });

    if (!analyticsReady) {
      await initAnalytics();
      analyticsReady = true;
    }

    await upsertPresence(sessionId, page ?? "/", deviceType ?? "desktop");
    await recordPageView(sessionId, page ?? "/", deviceType ?? "desktop");

    const online = await getOnlineCount();
    return NextResponse.json({ online });
  } catch (err) {
    console.error("[heartbeat]", err);
    return NextResponse.json({ online: 1 });
  }
}
