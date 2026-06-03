import { NextRequest, NextResponse } from "next/server";

// Comma-separated list of trusted public IPs (home, office, carrier, etc.)
// Set OWNER_TRUSTED_IPS in .env.local — e.g. "98.12.34.56,76.88.99.10"
const TRUSTED_IPS = (process.env.OWNER_TRUSTED_IPS ?? "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-client-ip") ??
    ""
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);

  // Always trusted when running locally
  const isLocalhost =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("::ffff:127.");

  // Match against owner's configured public IPs (exact or prefix match)
  const isConfigured =
    TRUSTED_IPS.length > 0 &&
    TRUSTED_IPS.some((trusted) => ip === trusted || ip.startsWith(trusted));

  return NextResponse.json({ trusted: isLocalhost || isConfigured });
}
