import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ArchivedItem {
  id: string;
  name: string;
  type: "skill" | "agent" | "prompt" | "idea";
  description: string;
  code: string;
  prompt?: string;
  archivedAt: string;
  downloads: number;
  shares: number;
}

interface ArchiveStore {
  items: ArchivedItem[];
  addItem: (item: Omit<ArchivedItem, "id" | "archivedAt" | "downloads" | "shares">) => string;
  removeItem: (id: string) => void;
  incrementDownloads: (id: string) => void;
  incrementShares: (id: string) => void;
}

export const useArchiveStore = create<ArchiveStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `arc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newItem: ArchivedItem = {
          ...item,
          id,
          archivedAt: new Date().toISOString(),
          downloads: 0,
          shares: 0,
        };
        set((s) => ({ items: [newItem, ...s.items] }));
        return id;
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      incrementDownloads: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, downloads: i.downloads + 1 } : i
          ),
        })),

      incrementShares: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, shares: i.shares + 1 } : i
          ),
        })),
    }),
    {
      name: "aihub-archive",
    }
  )
);
