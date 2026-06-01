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
