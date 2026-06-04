import { NextResponse } from "next/server";
import { getOnlineCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await getOnlineCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 1 });
  }
}
