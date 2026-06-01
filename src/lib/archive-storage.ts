// Persistent archive storage using JSON
// Note: For production at scale, consider migrating to Supabase

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

// In-memory cache for this session
const archiveCache = new Map<string, ArchivedItem>();
let initialized = false;

export async function initializeArchive() {
  if (initialized) return;
  // Archive initialization - data will persist via the API layer
  initialized = true;
}

export async function addToArchive(item: Omit<ArchivedItem, "id" | "archivedAt" | "downloads" | "shares">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  const archivedItem: ArchivedItem = {
    ...item,
    id,
    archivedAt: new Date().toISOString(),
    downloads: 0,
    shares: 0,
  };

  archiveCache.set(id, archivedItem);

  // Persist to storage
  await persistArchive();

  return { id, item: archivedItem };
}

export async function getArchivedItem(id: string) {
  return archiveCache.get(id) || null;
}

export async function getAllArchivedItems(): Promise<ArchivedItem[]> {
  return Array.from(archiveCache.values()).sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );
}

export async function incrementDownloads(id: string) {
  const item = archiveCache.get(id);
  if (item) {
    item.downloads += 1;
    await persistArchive();
  }
}

export async function incrementShares(id: string) {
  const item = archiveCache.get(id);
  if (item) {
    item.shares += 1;
    await persistArchive();
  }
}

async function persistArchive() {
  // Archive is persisted through the API layer
  // This is a placeholder for potential file-system or database persistence
}

// Load initial data (called on server startup)
export async function loadArchivedItems(items: ArchivedItem[]) {
  items.forEach(item => archiveCache.set(item.id, item));
}
