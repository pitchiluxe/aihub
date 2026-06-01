import { NextRequest, NextResponse } from "next/server";

// Simple in-memory archive (can be replaced with Supabase later)
const archivedItems: Map<string, any> = new Map();

export async function POST(req: NextRequest) {
  try {
    const item = await req.json();

    if (!item || !item.code || !item.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique ID for this shared item
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // Add archival metadata
    const archivedItem = {
      ...item,
      id,
      archivedAt: new Date().toISOString(),
      downloads: 0,
      shares: 0,
    };

    archivedItems.set(id, archivedItem);

    return NextResponse.json({
      id,
      shareUrl: `/archive/${id}`,
      message: "Item archived and ready to share!",
    });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json(
      { error: "Archive failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      // Return all archived items
      const items = Array.from(archivedItems.values()).sort(
        (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
      );
      return NextResponse.json({ items });
    }

    // Return specific item
    const item = archivedItems.get(id);
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Fetch failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing id or action" },
        { status: 400 }
      );
    }

    const item = archivedItems.get(id);
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (action === "download") {
      item.downloads += 1;
    } else if (action === "share") {
      item.shares += 1;
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
