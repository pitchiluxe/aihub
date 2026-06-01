import { NextRequest, NextResponse } from "next/server";
import {
  initializeDatabase,
  addArchivedItem,
  getArchivedItem,
  getAllArchivedItems,
  incrementDownloads,
  incrementShares,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const item = await req.json();

    if (!item || !item.code || !item.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize database
    await initializeDatabase();

    // Add to database
    const archivedItem = await addArchivedItem(item);

    return NextResponse.json({
      id: archivedItem.id,
      shareUrl: `/archive/${archivedItem.id}`,
      message: "Item archived and ready to share!",
    });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json(
      { error: "Archive failed: " + String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Initialize database
    await initializeDatabase();

    if (!id) {
      // Return all archived items
      const items = await getAllArchivedItems();
      return NextResponse.json({ items });
    }

    // Return specific item
    const item = await getArchivedItem(id);
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
      { error: "Fetch failed: " + String(error) },
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

    // Initialize database
    await initializeDatabase();

    let item = null;
    if (action === "download") {
      item = await incrementDownloads(id);
    } else if (action === "share") {
      item = await incrementShares(id);
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Update failed: " + String(error) },
      { status: 500 }
    );
  }
}
