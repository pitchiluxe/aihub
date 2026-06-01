import { NextRequest, NextResponse } from "next/server";
import {
  addItem,
  getItem,
  getAllItems,
  incrementDownloads,
  incrementShares,
} from "@/lib/archive-file-storage";

export async function POST(req: NextRequest) {
  try {
    const item = await req.json();

    if (!item || !item.code || !item.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add to file-based archive
    const archivedItem = await addItem(item);

    return NextResponse.json({
      id: archivedItem.id,
      shareUrl: `/archive/${archivedItem.id}`,
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
      const items = await getAllItems();
      return NextResponse.json({ items });
    }

    // Return specific item
    const item = await getItem(id);
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
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
