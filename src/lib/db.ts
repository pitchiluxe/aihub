import postgres from "postgres";

let sql: ReturnType<typeof postgres>;

function getConnection() {
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL || "");
  }
  return sql;
}

// Initialize database table if it doesn't exist
export async function initializeDatabase() {
  try {
    const sql = getConnection();
    
    await sql`
      CREATE TABLE IF NOT EXISTS archived_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        code TEXT NOT NULL,
        "archivedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        downloads INT DEFAULT 0,
        shares INT DEFAULT 0
      );
    `;
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_archived_items_type ON archived_items(type);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_archived_items_archived_at ON archived_items("archivedAt" DESC);
    `;
    
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

export interface ArchivedItem {
  id: string;
  name: string;
  type: "skill" | "agent";
  description: string;
  code: string;
  archivedAt: string;
  downloads: number;
  shares: number;
}

export async function addArchivedItem(item: Omit<ArchivedItem, "id" | "archivedAt" | "downloads" | "shares">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const sql = getConnection();
  
  try {
    const result: any[] = await sql`
      INSERT INTO archived_items (id, name, type, description, code)
      VALUES (${id}, ${item.name}, ${item.type}, ${item.description}, ${item.code})
      RETURNING *;
    `;
    
    return result[0] as ArchivedItem;
  } catch (error) {
    console.error("Error adding archived item:", error);
    throw error;
  }
}

export async function getArchivedItem(id: string): Promise<ArchivedItem | null> {
  const sql = getConnection();
  
  try {
    const result: any[] = await sql`
      SELECT * FROM archived_items WHERE id = ${id};
    `;
    
    return (result[0] as ArchivedItem) || null;
  } catch (error) {
    console.error("Error getting archived item:", error);
    throw error;
  }
}

export async function getAllArchivedItems(): Promise<ArchivedItem[]> {
  const sql = getConnection();
  
  try {
    const result: any[] = await sql`
      SELECT * FROM archived_items 
      ORDER BY "archivedAt" DESC;
    `;
    
    return result as ArchivedItem[];
  } catch (error) {
    console.error("Error getting all archived items:", error);
    throw error;
  }
}

export async function incrementDownloads(id: string): Promise<ArchivedItem | null> {
  const sql = getConnection();
  
  try {
    const result: any[] = await sql`
      UPDATE archived_items 
      SET downloads = downloads + 1
      WHERE id = ${id}
      RETURNING *;
    `;
    
    return (result[0] as ArchivedItem) || null;
  } catch (error) {
    console.error("Error incrementing downloads:", error);
    throw error;
  }
}

export async function incrementShares(id: string): Promise<ArchivedItem | null> {
  const sql = getConnection();

  try {
    const result: any[] = await sql`
      UPDATE archived_items
      SET shares = shares + 1
      WHERE id = ${id}
      RETURNING *;
    `;

    return (result[0] as ArchivedItem) || null;
  } catch (error) {
    console.error("Error incrementing shares:", error);
    throw error;
  }
}

// ─── Analytics & Presence ─────────────────────────────────────────────────────

export async function initAnalytics() {
  const db = getConnection();
  await db`
    CREATE TABLE IF NOT EXISTS aihub_presence (
      session_id TEXT PRIMARY KEY,
      page        TEXT        NOT NULL DEFAULT '/',
      device_type TEXT        NOT NULL DEFAULT 'desktop',
      last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON aihub_presence(last_seen)`;
  await db`
    CREATE TABLE IF NOT EXISTS aihub_page_views (
      id          BIGSERIAL   PRIMARY KEY,
      session_id  TEXT        NOT NULL,
      page        TEXT        NOT NULL DEFAULT '/',
      device_type TEXT        NOT NULL DEFAULT 'desktop',
      viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_pv_viewed_at ON aihub_page_views(viewed_at)`;
  await db`CREATE INDEX IF NOT EXISTS idx_pv_session_page ON aihub_page_views(session_id, page, viewed_at DESC)`;
}

export async function upsertPresence(sessionId: string, page: string, deviceType: string) {
  const db = getConnection();
  await db`
    INSERT INTO aihub_presence (session_id, page, device_type, last_seen)
    VALUES (${sessionId}, ${page}, ${deviceType}, NOW())
    ON CONFLICT (session_id) DO UPDATE SET
      page        = EXCLUDED.page,
      device_type = EXCLUDED.device_type,
      last_seen   = NOW()
  `;
  // Prune stale sessions older than 5 min (cheap cleanup without a separate job)
  await db`DELETE FROM aihub_presence WHERE last_seen < NOW() - INTERVAL '5 minutes'`;
}

export async function getOnlineCount(): Promise<number> {
  const db = getConnection();
  const result = await db`
    SELECT COUNT(*) AS cnt FROM aihub_presence
    WHERE last_seen > NOW() - INTERVAL '90 seconds'
  `;
  return Number(result[0]?.cnt ?? 0);
}

export async function recordPageView(sessionId: string, page: string, deviceType: string) {
  const db = getConnection();
  // Deduplicate: one view per session+page per 5 min
  const recent = await db`
    SELECT 1 FROM aihub_page_views
    WHERE session_id = ${sessionId} AND page = ${page}
      AND viewed_at > NOW() - INTERVAL '5 minutes'
    LIMIT 1
  `;
  if (recent.length === 0) {
    await db`
      INSERT INTO aihub_page_views (session_id, page, device_type)
      VALUES (${sessionId}, ${page}, ${deviceType})
    `;
  }
}

export interface DailyStats {
  date: string;
  totalViews: number;
  uniqueSessions: number;
  peakHour: number;
  peakHourViews: number;
  topPage: string;
  topPages: Array<{ page: string; views: number; pct: number }>;
  hourly: Array<{ hour: number; views: number }>;
  devices: { desktop: number; mobile: number; tablet: number };
}

export async function getDailyStats(dateUTC: string): Promise<DailyStats> {
  const db = getConnection();

  const totals = await db`
    SELECT COUNT(*) AS total, COUNT(DISTINCT session_id) AS uniq
    FROM aihub_page_views
    WHERE DATE(viewed_at AT TIME ZONE 'UTC') = ${dateUTC}
  `;

  const topPagesRaw = await db`
    SELECT page, COUNT(*) AS views
    FROM aihub_page_views
    WHERE DATE(viewed_at AT TIME ZONE 'UTC') = ${dateUTC}
    GROUP BY page ORDER BY views DESC LIMIT 6
  `;

  const hourlyRaw = await db`
    SELECT EXTRACT(HOUR FROM viewed_at AT TIME ZONE 'UTC') AS hr, COUNT(*) AS views
    FROM aihub_page_views
    WHERE DATE(viewed_at AT TIME ZONE 'UTC') = ${dateUTC}
    GROUP BY hr ORDER BY hr
  `;

  const devicesRaw = await db`
    SELECT device_type, COUNT(*) AS cnt
    FROM aihub_page_views
    WHERE DATE(viewed_at AT TIME ZONE 'UTC') = ${dateUTC}
    GROUP BY device_type
  `;

  const totalViews   = Number(totals[0]?.total ?? 0);
  const uniqueSessions = Number(totals[0]?.uniq ?? 0);

  const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, views: 0 }));
  for (const r of hourlyRaw) hourly[Number(r.hr)].views = Number(r.views);
  const peakEntry = hourly.reduce((a, b) => (b.views > a.views ? b : a), hourly[0]);

  const topPages = topPagesRaw.map((r: any) => ({
    page:  String(r.page),
    views: Number(r.views),
    pct:   totalViews > 0 ? Math.round((Number(r.views) / totalViews) * 100) : 0,
  }));

  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  for (const r of devicesRaw) {
    const dt = String(r.device_type);
    if (dt === "mobile")  devices.mobile  = Number(r.cnt);
    else if (dt === "tablet") devices.tablet = Number(r.cnt);
    else devices.desktop = Number(r.cnt);
  }

  return {
    date: dateUTC,
    totalViews,
    uniqueSessions,
    peakHour:      peakEntry.hour,
    peakHourViews: peakEntry.views,
    topPage:       topPages[0]?.page ?? "/",
    topPages,
    hourly,
    devices,
  };
}
