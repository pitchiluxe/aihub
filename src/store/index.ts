import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AgentConversation, AgentMessage, NewsArticle, SearchResult } from "@/types";

interface AppState {
  // Theme
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Command Palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  // Saved items
  savedArticles: NewsArticle[];
  saveArticle: (article: NewsArticle) => void;
  unsaveArticle: (id: string) => void;
  isArticleSaved: (id: string) => boolean;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Search results
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;

  // Agent conversations
  conversations: AgentConversation[];
  activeConversationId: string | null;
  addMessage: (conversationId: string, message: AgentMessage) => void;
  createConversation: (agentId: string) => string;
  setActiveConversation: (id: string | null) => void;
  getConversation: (id: string) => AgentConversation | undefined;

  // Models filter
  selectedProvider: string;
  setSelectedProvider: (p: string) => void;
  freeOnly: boolean;
  setFreeOnly: (v: boolean) => void;

  // News filters
  newsCategory: string;
  setNewsCategory: (c: string) => void;

  // Battle arena
  battleModels: string[];
  setBattleModels: (models: string[]) => void;
  addBattleModel: (model: string) => void;
  removeBattleModel: (model: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),

      savedArticles: [],
      saveArticle: (article) =>
        set((s) => ({
          savedArticles: s.savedArticles.some((a) => a.id === article.id)
            ? s.savedArticles
            : [article, ...s.savedArticles],
        })),
      unsaveArticle: (id) =>
        set((s) => ({ savedArticles: s.savedArticles.filter((a) => a.id !== id) })),
      isArticleSaved: (id) => get().savedArticles.some((a) => a.id === id),

      recentSearches: [],
      addRecentSearch: (query) =>
        set((s) => ({
          recentSearches: [query, ...s.recentSearches.filter((q) => q !== query)].slice(0, 10),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),

      searchResults: [],
      setSearchResults: (results) => set({ searchResults: results }),
      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),
      isSearching: false,
      setIsSearching: (v) => set({ isSearching: v }),

      conversations: [],
      activeConversationId: null,
      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message], updatedAt: new Date() }
              : c
          ),
        })),
      createConversation: (agentId) => {
        const id = `conv-${Date.now()}`;
        set((s) => ({
          conversations: [
            ...s.conversations,
            { id, agentId, messages: [], createdAt: new Date(), updatedAt: new Date() },
          ],
          activeConversationId: id,
        }));
        return id;
      },
      setActiveConversation: (id) => set({ activeConversationId: id }),
      getConversation: (id) => get().conversations.find((c) => c.id === id),

      selectedProvider: "all",
      setSelectedProvider: (p) => set({ selectedProvider: p }),
      freeOnly: false,
      setFreeOnly: (v) => set({ freeOnly: v }),

      newsCategory: "all",
      setNewsCategory: (c) => set({ newsCategory: c }),

      battleModels: [],
      setBattleModels: (models) => set({ battleModels: models }),
      addBattleModel: (model) =>
        set((s) => ({
          battleModels: s.battleModels.includes(model)
            ? s.battleModels
            : [...s.battleModels, model].slice(0, 4),
        })),
      removeBattleModel: (model) =>
        set((s) => ({ battleModels: s.battleModels.filter((m) => m !== model) })),
    }),
    {
      name: "aihub-store",
      partialize: (state) => ({
        savedArticles: state.savedArticles,
        recentSearches: state.recentSearches,
        conversations: state.conversations,
        freeOnly: state.freeOnly,
        selectedProvider: state.selectedProvider,
        battleModels: state.battleModels,
      }),
    }
  )
);
