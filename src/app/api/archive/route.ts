import { NextRequest, NextResponse } from "next/server";

// Graceful no-op when no DATABASE_URL — archive is handled client-side via Zustand store
async function tryDbArchive(item: Record<string, unknown>) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { initializeDatabase, addArchivedItem } = await import("@/lib/db");
    await initializeDatabase();
    return await addArchivedItem(item as Parameters<typeof addArchivedItem>[0]);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const item = await req.json();
    if (!item || !item.code || !item.name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const archived = await tryDbArchive(item);
    const id = archived?.id ?? `arc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return NextResponse.json({
      id,
      shareUrl: `/archive/${id}`,
      message: "Item archived!",
    });
  } catch (error) {
    console.error("Archive error:", error);
    // Return a valid fallback so the generate flow never breaks
    const id = `arc-${Date.now()}`;
    return NextResponse.json({ id, shareUrl: `/archive/${id}`, message: "Archived (local)" });
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    // Archive is handled client-side — return empty list
    return NextResponse.json({ items: [] });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const { initializeDatabase, getAllArchivedItems, getArchivedItem } = await import("@/lib/db");
    await initializeDatabase();
    if (!id) {
      const items = await getAllArchivedItems();
      return NextResponse.json({ items });
    }
    const item = await getArchivedItem(id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function PATCH(req: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: true });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
    const { initializeDatabase, incrementDownloads, incrementShares } = await import("@/lib/db");
    await initializeDatabase();
    const item = action === "download" ? await incrementDownloads(id) : await incrementShares(id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
