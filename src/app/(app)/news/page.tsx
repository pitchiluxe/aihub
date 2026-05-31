"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NewsArticle, NewsCategory } from "@/types";
import { formatDate, getColorForCategory, truncate } from "@/lib/utils";
import { useStore } from "@/store";
import {
  Search, Bookmark, BookmarkCheck, ExternalLink, Clock, RefreshCw,
  Newspaper, Archive, Network, Brain, Plus, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES: { id: NewsCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google AI" },
  { id: "meta", label: "Meta AI" },
  { id: "microsoft", label: "Microsoft" },
  { id: "xai", label: "xAI" },
  { id: "mistral", label: "Mistral" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "open-source", label: "Open Source" },
  { id: "research", label: "Research" },
  { id: "robotics", label: "Robotics" },
  { id: "startups", label: "Startups" },
  { id: "agents", label: "Agents" },
  { id: "prompt-engineering", label: "Prompts" },
];

const ONE_WEEK_MS  = 7  * 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function isRecent(publishedAt: string)   { return Date.now() - new Date(publishedAt).getTime() < ONE_WEEK_MS; }
function isArchived(publishedAt: string) { return !isRecent(publishedAt); }

export default function NewsPage() {
  const [articles, setArticles]     = useState<NewsArticle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [addedToLM, setAddedToLM]   = useState<Set<string>>(new Set());

  const { newsCategory, setNewsCategory, saveArticle, unsaveArticle, isArticleSaved } = useStore();

  async function loadNews(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch("/api/news?limit=80");
      const data = await res.json();
      setArticles(data.articles ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadNews(); }, []);

  function filterArticles(list: NewsArticle[]) {
    let result = list;
    if (newsCategory !== "all") result = result.filter((a) => a.category === newsCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)
      );
    }
    return result;
  }

  const recent   = filterArticles(articles.filter((a) => isRecent(a.publishedAt)));
  const archived = filterArticles(articles.filter((a) => isArchived(a.publishedAt)));

  function addToObsidian(article: NewsArticle) {
    toast.success("Article added to Obsidian graph as a news node", { icon: "🕸️" });
  }

  function addToAIHubLM(article: NewsArticle) {
    setAddedToLM((prev) => new Set([...prev, article.id]));
    // Store in sessionStorage so AIHub LM can pick it up
    const existing = JSON.parse(sessionStorage.getItem("aihumlm_queue") ?? "[]");
    sessionStorage.setItem("aihumlm_queue", JSON.stringify([
      ...existing,
      { id: article.id, title: article.title, content: article.summary, url: article.url, type: "url" },
    ]));
    toast.success("Added to AIHub LM — open AIHub LM to chat about it", { icon: "🧠" });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="News Center" description="Real-time AI intelligence from 24+ sources" />
      <div className="flex-1 p-6 space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search news, sources, topics..."
            icon={<Search className="h-3.5 w-3.5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={() => loadNews(true)} loading={refreshing} className="gap-2 flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setNewsCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                newsCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tabs: Recent / Archive */}
        <Tabs defaultValue="recent">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="recent" className="gap-2">
                <Newspaper className="h-3.5 w-3.5" />
                Live Feed
                {!loading && <span className="ml-1 rounded-full bg-green-500 text-white text-[10px] px-1.5 py-0.5 font-bold">{recent.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="archive" className="gap-2">
                <Archive className="h-3.5 w-3.5" />
                Archive
                {!loading && archived.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted-foreground/40 text-white text-[10px] px-1.5 py-0.5 font-bold">{archived.length}</span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1.5 text-xs text-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live · updates every 5 min
            </div>
          </div>

          {/* Live Feed */}
          <TabsContent value="recent" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <>
                {recent.length === 0 && (
                  <div className="py-20 text-center">
                    <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No recent articles found.</p>
                  </div>
                )}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  initial="hidden" animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                >
                  {recent.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isSaved={isArticleSaved(article.id)}
                      addedToLM={addedToLM.has(article.id)}
                      onSave={() => {
                        if (isArticleSaved(article.id)) { unsaveArticle(article.id); toast.success("Removed from saved"); }
                        else { saveArticle(article); toast.success("Article saved"); }
                      }}
                      onObsidian={() => addToObsidian(article)}
                      onAIHubLM={() => addToAIHubLM(article)}
                    />
                  ))}
                </motion.div>
              </>
            )}
          </TabsContent>

          {/* Archive */}
          <TabsContent value="archive" className="mt-4">
            <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Archive className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">News Archive</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Articles older than 7 days. Add them to AIHub LM or the Obsidian graph for deeper analysis.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : archived.length === 0 ? (
              <div className="py-16 text-center">
                <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No archived articles yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Articles older than 7 days will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archived.map((article) => (
                  <ArchiveRow
                    key={article.id}
                    article={article}
                    addedToLM={addedToLM.has(article.id)}
                    onObsidian={() => addToObsidian(article)}
                    onAIHubLM={() => addToAIHubLM(article)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ArticleCard({
  article, isSaved, addedToLM, onSave, onObsidian, onAIHubLM,
}: {
  article: NewsArticle;
  isSaved: boolean;
  addedToLM: boolean;
  onSave: () => void;
  onObsidian: () => void;
  onAIHubLM: () => void;
}) {
  const color = getColorForCategory(article.category);
  const isVideo = article.tags.includes("📺 Video");

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } } }}>
      <Card className="group h-full flex flex-col hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
        {article.imageUrl && (
          <div className="h-36 overflow-hidden bg-muted flex-shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <CardContent className="flex-1 flex flex-col p-4 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: color }}>
              {isVideo && "🎬 "}{article.source}
            </div>
            {article.isBreaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
          </div>

          <div className="flex-1">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <h3 className="text-sm font-semibold leading-snug line-clamp-3 hover:text-primary transition-colors">
                {article.title}
              </h3>
            </a>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{truncate(article.summary, 160)}</p>
          </div>

          {article.tags.filter(t => t !== "📺 Video").length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {article.tags.filter(t => t !== "📺 Video").slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onObsidian} title="Add to Obsidian graph" className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Network className="h-3.5 w-3.5" />
              </button>
              <button onClick={onAIHubLM} title="Add to AIHub LM" className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                {addedToLM ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Brain className="h-3.5 w-3.5" />}
              </button>
              <button onClick={onSave} className="p-1 rounded hover:bg-accent transition-colors">
                {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ArchiveRow({ article, addedToLM, onObsidian, onAIHubLM }: {
  article: NewsArticle;
  addedToLM: boolean;
  onObsidian: () => void;
  onAIHubLM: () => void;
}) {
  const color = getColorForCategory(article.category);
  const daysOld = Math.floor((Date.now() - new Date(article.publishedAt).getTime()) / 86400000);
  return (
    <Card className="group hover:shadow-sm transition-all">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="flex-1 min-w-0">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <p className="text-sm font-medium leading-snug hover:text-primary transition-colors line-clamp-2">{article.title}</p>
            </a>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{article.source}</span>
              <span>·</span>
              <span>{daysOld}d ago</span>
              <Badge variant="outline" className="text-xs ml-1">Archived</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onObsidian} title="Add to Obsidian" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Network className="h-3.5 w-3.5" />
            </button>
            <button onClick={onAIHubLM} title="Add to AIHub LM" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              {addedToLM ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Brain className="h-3.5 w-3.5" />}
            </button>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
