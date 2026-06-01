import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const { item } = await req.json();

    if (!item || !item.code || !item.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create zip archive
    const zip = new JSZip();

    // Add the generated file to the zip
    const filename = `${item.type === "skill" ? "SKILL" : "AGENT"}.md`;
    zip.file(filename, item.code);

    // Add README with metadata
    const readme = `# ${item.name}

**Type:** ${item.type}
**Description:** ${item.description || "No description provided"}
**Generated:** ${new Date().toISOString()}

## Contents

- \`${filename}\` - Main ${item.type} file
- \`README.md\` - This file

## How to Use

1. Extract this archive
2. Copy \`${filename}\` to your AIHub installation
3. Import or reference in your project
`;
    zip.file("README.md", readme);

    // Generate the zip file
    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    // Create proper filename
    const zipFilename = `${item.name.toLowerCase().replace(/\s+/g, "-")}-${item.type}.zip`;

    // Return zip file with correct headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed: " + String(error) },
      { status: 500 }
    );
  }
}
