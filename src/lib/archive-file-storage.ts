import fs from "fs/promises";
import path from "path";

const ARCHIVE_FILE = path.join(process.cwd(), "data", "archive.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.dirname(ARCHIVE_FILE), { recursive: true });
  } catch (error) {
    console.warn("Could not create data directory:", error);
  }
}

// Load archived items from file
async function loadArchive() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ARCHIVE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet or parse error - return empty array
    return [];
  }
}

// Save archived items to file
async function saveArchive(items: any[]) {
  try {
    await ensureDataDir();
    await fs.writeFile(ARCHIVE_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save archive:", error);
    throw error;
  }
}

export async function addItem(item: any) {
  const items = await loadArchive();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  const newItem = {
    ...item,
    id,
    archivedAt: new Date().toISOString(),
    downloads: 0,
    shares: 0,
  };

  items.push(newItem);
  await saveArchive(items);
  
  return newItem;
}

export async function getItem(id: string) {
  const items = await loadArchive();
  return items.find((item: any) => item.id === id) || null;
}

export async function getAllItems() {
  const items = await loadArchive();
  return items.sort((a: any, b: any) => 
    new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );
}

export async function updateItem(id: string, updates: any) {
  const items = await loadArchive();
  const itemIndex = items.findIndex((item: any) => item.id === id);
  
  if (itemIndex === -1) {
    return null;
  }

  items[itemIndex] = { ...items[itemIndex], ...updates };
  await saveArchive(items);
  
  return items[itemIndex];
}

export async function incrementDownloads(id: string) {
  const item = await getItem(id);
  if (!item) return null;
  
  return updateItem(id, { downloads: item.downloads + 1 });
}

export async function incrementShares(id: string) {
  const item = await getItem(id);
  if (!item) return null;
  
  return updateItem(id, { shares: item.shares + 1 });
}
