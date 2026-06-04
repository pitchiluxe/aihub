import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDailyStats, initAnalytics, type DailyStats } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ─── Auth guard ───────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode — no secret set
  const header = req.headers.get("authorization") ?? "";
  const query  = req.nextUrl.searchParams.get("secret") ?? "";
  return header === `Bearer ${secret}` || query === secret;
}

// ─── Email HTML builder ───────────────────────────────────────────────────────
function buildEmailHtml(stats: DailyStats): string {
  const { date, totalViews, uniqueSessions, peakHour, peakHourViews, topPages, hourly, devices } = stats;

  const totalDevices = devices.desktop + devices.mobile + devices.tablet || 1;
  const desktopPct   = Math.round((devices.desktop / totalDevices) * 100);
  const mobilePct    = Math.round((devices.mobile  / totalDevices) * 100);
  const tabletPct    = 100 - desktopPct - mobilePct;

  const maxViews = Math.max(...hourly.map(h => h.views), 1);

  // 24-hour activity chart rows
  const hourlyRows = hourly.map(({ hour, views }) => {
    const barW   = Math.round((views / maxViews) * 160);
    const isPeak = hour === peakHour && views > 0;
    const label  = String(hour).padStart(2, "0") + ":00";
    const barColor = isPeak ? "#6366f1" : "#1e2d4a";
    return `
      <tr>
        <td style="padding:2px 8px 2px 0;color:#475569;font-size:10px;font-family:monospace;white-space:nowrap;width:40px;">${label}</td>
        <td style="padding:2px 0;">
          <div style="display:inline-block;height:10px;width:${barW}px;background:${barColor};border-radius:2px;min-width:${views > 0 ? 3 : 0}px;"></div>
        </td>
        <td style="padding:2px 0 2px 8px;color:${isPeak ? "#a5b4fc" : "#334155"};font-size:10px;font-family:monospace;">
          ${views}${isPeak ? " ← peak" : ""}
        </td>
      </tr>`;
  }).join("");

  // Top pages rows
  const topPageRows = topPages.slice(0, 5).map((p, i) => {
    const medals = ["🥇", "🥈", "🥉", "4.", "5."];
    const pageName = p.page.replace(/^\//, "") || "dashboard";
    return `
      <tr>
        <td style="padding:5px 12px 5px 0;color:#94a3b8;font-size:12px;width:20px;">${medals[i]}</td>
        <td style="padding:5px 0;color:#e2e8f0;font-size:12px;font-weight:600;">/${pageName}</td>
        <td style="padding:5px 0 5px 12px;color:#6366f1;font-size:12px;font-weight:700;text-align:right;">${p.views}</td>
        <td style="padding:5px 0 5px 8px;color:#475569;font-size:10px;text-align:right;">${p.pct}%</td>
      </tr>`;
  }).join("");

  const fmt12h = (h: number) => {
    const ampm = h < 12 ? "AM" : "PM";
    const h12  = h % 12 || 12;
    return `${h12}:00 ${ampm}`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AIHub Daily Report</title></head>
<body style="margin:0;padding:0;background:#070b12;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#070b12;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- ── Header ── -->
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e1035 60%,#0f2027 100%);border-radius:16px 16px 0 0;padding:0;overflow:hidden;border:1px solid rgba(99,102,241,0.2);border-bottom:none;">
    <div style="height:4px;background:linear-gradient(90deg,#6366f1,#a855f7,#f59e0b);"></div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:28px 32px;">
      <tr>
        <td>
          <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">AIHub</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6366f1;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Daily Analytics Report</p>
        </td>
        <td align="right">
          <p style="margin:0;font-size:14px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${date}</p>
          <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#374151;background:#0f172a;border:1px solid rgba(255,255,255,0.06);padding:3px 8px;border-radius:20px;display:inline-block;font-family:monospace;letter-spacing:1px;">PRIVATE</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ── 4 Key Metrics ── -->
  <tr><td style="background:#0d1421;padding:24px 32px 16px;border-left:1px solid rgba(99,102,241,0.15);border-right:1px solid rgba(99,102,241,0.15);">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="25%" style="padding-right:6px;">
          <div style="background:#0a1628;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 12px;text-align:center;">
            <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Page Views</p>
            <p style="margin:0;font-size:30px;font-weight:900;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${totalViews.toLocaleString()}</p>
          </div>
        </td>
        <td width="25%" style="padding:0 3px;">
          <div style="background:#0a1628;border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px 12px;text-align:center;">
            <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Visitors</p>
            <p style="margin:0;font-size:30px;font-weight:900;color:#6366f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${uniqueSessions.toLocaleString()}</p>
          </div>
        </td>
        <td width="25%" style="padding:0 3px;">
          <div style="background:#0a1628;border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:16px 12px;text-align:center;">
            <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Peak Hour</p>
            <p style="margin:0;font-size:30px;font-weight:900;color:#a855f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${peakHourViews}</p>
            <p style="margin:4px 0 0;font-size:9px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${fmt12h(peakHour)}</p>
          </div>
        </td>
        <td width="25%" style="padding-left:6px;">
          <div style="background:#0a1628;border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:16px 12px;text-align:center;">
            <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Top Page</p>
            <p style="margin:0;font-size:13px;font-weight:900;color:#10b981;font-family:monospace;">${(topPages[0]?.page ?? "/").replace(/^\//, "") || "home"}</p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ── Hourly Chart ── -->
  <tr><td style="background:#0d1421;padding:20px 32px;border-left:1px solid rgba(99,102,241,0.15);border-right:1px solid rgba(99,102,241,0.15);">
    <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6366f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">📊 &nbsp;Hourly Activity (UTC)</p>
    <table cellpadding="0" cellspacing="0" border="0">${hourlyRows}</table>
  </td></tr>

  <!-- ── Top Pages ── -->
  <tr><td style="background:#0d1421;padding:20px 32px;border-left:1px solid rgba(99,102,241,0.15);border-right:1px solid rgba(99,102,241,0.15);">
    <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6366f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">🏆 &nbsp;Top Pages</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">${topPageRows}</table>
  </td></tr>

  <!-- ── Devices ── -->
  <tr><td style="background:#0d1421;padding:20px 32px 24px;border-left:1px solid rgba(99,102,241,0.15);border-right:1px solid rgba(99,102,241,0.15);">
    <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6366f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">📱 &nbsp;Device Split</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="33%" align="center" style="padding:0 4px 0 0;">
          <div style="background:#0a1628;border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px;">
            <p style="margin:0 0 2px;font-size:18px;">🖥️</p>
            <p style="margin:0;font-size:20px;font-weight:900;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${desktopPct}%</p>
            <p style="margin:2px 0 0;font-size:9px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Desktop</p>
          </div>
        </td>
        <td width="33%" align="center" style="padding:0 2px;">
          <div style="background:#0a1628;border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px;">
            <p style="margin:0 0 2px;font-size:18px;">📱</p>
            <p style="margin:0;font-size:20px;font-weight:900;color:#6366f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${mobilePct}%</p>
            <p style="margin:2px 0 0;font-size:9px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Mobile</p>
          </div>
        </td>
        <td width="33%" align="center" style="padding:0 0 0 4px;">
          <div style="background:#0a1628;border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px;">
            <p style="margin:0 0 2px;font-size:18px;">📲</p>
            <p style="margin:0;font-size:20px;font-weight:900;color:#a855f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${tabletPct}%</p>
            <p style="margin:2px 0 0;font-size:9px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Tablet</p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ── Footer ── -->
  <tr><td style="background:#050810;border:1px solid rgba(99,102,241,0.15);border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="margin:0;color:#1e293b;font-size:11px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      Your private <span style="color:#6366f1;font-weight:700;">AIHub</span> analytics · Delivered daily at midnight UTC
    </p>
    <p style="margin:6px 0 0;color:#0f172a;font-size:10px;font-family:monospace;">aihub-eight-xi.vercel.app</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const EMAIL_USER     = process.env.EMAIL_FROM ?? process.env.EMAIL_USER ?? "";
  const EMAIL_PASS     = process.env.EMAIL_APP_PASSWORD ?? "";
  const REPORT_TO      = process.env.REPORT_EMAIL ?? "technobiztrader@gmail.com";

  if (!EMAIL_USER || !EMAIL_PASS) {
    return NextResponse.json({ error: "EMAIL_FROM and EMAIL_APP_PASSWORD not configured" }, { status: 500 });
  }

  try {
    await initAnalytics();

    // Yesterday UTC
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);

    const stats = await getDailyStats(dateStr);
    const html  = buildEmailHtml(stats);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"AIHub Analytics" <${EMAIL_USER}>`,
      to:      REPORT_TO,
      subject: `📊 AIHub Daily Report — ${dateStr} | ${stats.totalViews} views · ${stats.uniqueSessions} visitors`,
      html,
    });

    return NextResponse.json({
      sent: true,
      to:   REPORT_TO,
      date: dateStr,
      stats: {
        totalViews:      stats.totalViews,
        uniqueSessions:  stats.uniqueSessions,
        peakHourViews:   stats.peakHourViews,
        topPage:         stats.topPage,
      },
    });
  } catch (err) {
    console.error("[daily-report]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
