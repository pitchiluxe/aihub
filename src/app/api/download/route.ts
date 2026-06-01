import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { item } = await req.json();

    if (!item || !item.code || !item.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a simple text-based ZIP using JSZip-like approach
    // For simplicity, we'll return the content as a downloadable file
    const filename = `${item.type}-${item.name.toLowerCase().replace(/\s+/g, "-")}.md`;
    const content = item.code;

    // Return as downloadable file
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
