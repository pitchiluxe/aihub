"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIModel } from "@/types";
import { formatNumber } from "@/lib/utils";
import { useStore } from "@/store";
import {
  Search, Brain, ExternalLink, Cpu, Sparkles, Flame,
  ChevronDown, ChevronUp, Copy, Check, X,
  Download, BookOpen, Clock, TrendingUp, RefreshCw, Code,
} from "lucide-react";

type SortKey = "newest" | "name" | "context" | "provider";

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [recentModels, setRecentModels] = useState<AIModel[]>([]);
  const [dynamicProviders, setDynamicProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { selectedProvider, setSelectedProvider, freeOnly, setFreeOnly } = useStore();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/models?source=all", { cache: "no-store" });
      const data = await res.json();
      setModels(data.models ?? []);
      setRecentModels(data.recentModels ?? []);
      // Build provider pills from actual data — top 12 most common
      const counts: Record<string, number> = {};
      for (const m of (data.models ?? []) as AIModel[]) {
        counts[m.provider] = (counts[m.provider] ?? 0) + 1;
      }
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([p]) => p);
      setDynamicProviders(top);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let result = [...models];
    if (freeOnly) result = result.filter((m) => m.isFree);
    if (selectedProvider !== "all") {
      result = result.filter((m) => m.provider.toLowerCase().includes(selectedProvider));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      if (sortBy === "context") return sortDir === "desc" ? b.contextWindow - a.contextWindow : a.contextWindow - b.contextWindow;
      if (sortBy === "name") return sortDir === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      if (sortBy === "provider") return sortDir === "desc" ? b.provider.localeCompare(a.provider) : a.provider.localeCompare(b.provider);
      return 0;
    });
    return result;
  }, [models, freeOnly, selectedProvider, search, sortBy, sortDir]);

  const freeCount = models.filter((m) => m.isFree).length;
  const openSourceCount = models.filter((m) => m.isOpenSource).length;
  const GRID_LIMIT = showAll ? filtered.length : 60;
  const TABLE_LIMIT = showAll ? filtered.length : 100;

  function toggleSort(col: SortKey) {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  const providers = ["all", ...dynamicProviders];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Models Hub" description="Every AI model — OpenRouter + HuggingFace, always up to date" />
      <div className="flex-1 p-3 md:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Models", value: loading ? "…" : formatNumber(models.length), sub: "OpenRouter + HuggingFace", color: "text-violet-500" },
            { label: "New This Month", value: loading ? "…" : formatNumber(recentModels.length), sub: "Released ≤ 60 days ago", color: "text-emerald-500" },
            { label: "Free Models", value: loading ? "…" : formatNumber(freeCount), sub: "No cost to run", color: "text-green-500" },
            { label: "Open Source", value: loading ? "…" : formatNumber(openSourceCount), sub: "Community models", color: "text-blue-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Releases Banner */}
        {!loading && recentModels.length > 0 && !search && selectedProvider === "all" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              <h2 className="text-sm font-semibold">New Releases</h2>
              <Badge variant="secondary" className="text-xs">{recentModels.length} in last 60 days</Badge>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {recentModels.slice(0, 15).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className="flex-shrink-0 w-48 text-left bg-gradient-to-br from-orange-500/10 to-violet-500/10 border border-orange-500/20 rounded-xl p-3 hover:border-orange-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30 px-1.5 py-0.5">NEW</Badge>
                    {m.isFree && <Badge variant="free" className="text-[10px] px-1.5 py-0.5">Free</Badge>}
                  </div>
                  <p className="text-xs font-semibold line-clamp-2 leading-tight">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize">{m.provider.split("/")[0]}</p>
                  {m.releaseDate && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(m.releaseDate)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search models by name, provider, capability…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant={freeOnly ? "default" : "outline"} size="sm" onClick={() => setFreeOnly(!freeOnly)} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Free Only
            </Button>
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Provider Filter — dynamic from actual data */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selectedProvider === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {p === "all" ? "All Providers" : p.split("/")[0]}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Sort:</span>
          {(["newest", "name", "context", "provider"] as SortKey[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleSort(s)}
              className={`px-2 py-1 rounded-md capitalize transition-colors ${
                sortBy === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {s} {sortBy === s ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>

        <Tabs defaultValue="grid">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Fetching latest models…" : `${filtered.length.toLocaleString()} models`}
            </p>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  initial="hidden" animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02 } } }}
                >
                  {filtered.slice(0, GRID_LIMIT).map((model) => (
                    <ModelGridCard key={model.id} model={model} onClick={() => setSelectedModel(model)} />
                  ))}
                </motion.div>
                {filtered.length > GRID_LIMIT && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => setShowAll(true)} className="gap-2">
                      Show all {filtered.length.toLocaleString()} models
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        { key: "name" as SortKey, label: "Model" },
                        { key: "provider" as SortKey, label: "Provider" },
                        { key: "context" as SortKey, label: "Context" },
                        { key: "newest" as SortKey, label: "Released" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => toggleSort(col.key)}
                        >
                          <span className="flex items-center gap-1">
                            {col.label}
                            {sortBy === col.key ? (
                              sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            ) : null}
                          </span>
                        </th>
                      ))}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(10)].map((_, i) => (
                          <tr key={i} className="border-b border-border">
                            {[...Array(5)].map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <div className="h-4 rounded bg-muted animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : filtered.slice(0, TABLE_LIMIT).map((model) => (
                          <tr
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3 font-medium max-w-xs">
                              <div className="flex items-center gap-2">
                                {model.isNew && (
                                  <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">NEW</span>
                                )}
                                <div>
                                  <div className="truncate" title={model.name}>{model.name}</div>
                                  <div className="text-xs text-muted-foreground truncate font-normal">{model.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground capitalize">
                              {model.provider.split("/")[0]}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              {model.contextWindow >= 1000
                                ? `${(model.contextWindow / 1000).toFixed(0)}K`
                                : model.contextWindow}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {model.releaseDate ? timeAgo(model.releaseDate) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {model.isFree && <Badge variant="free" className="text-xs">Free</Badge>}
                                {model.isOpenSource && <Badge variant="success" className="text-xs">Open</Badge>}
                                {model.source === "huggingface" && <Badge variant="secondary" className="text-xs">HF</Badge>}
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > TABLE_LIMIT && (
                <div className="p-4 text-center border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
                    Show all {filtered.length.toLocaleString()} models
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Model Detail Modal */}
      <AnimatePresence>
        {selectedModel && (
          <ModelDetailModal
            model={selectedModel}
            onClose={() => setSelectedModel(null)}
            onCopyCommand={(cmd) => {
              setCopiedCommand(cmd);
              setTimeout(() => setCopiedCommand(null), 2000);
            }}
            copiedCommand={copiedCommand}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ModelGridCard({ model, onClick }: { model: AIModel; onClick?: () => void }) {
  const providerColor: Record<string, string> = {
    "meta-llama": "from-blue-500 to-blue-600",
    mistralai: "from-orange-500 to-orange-600",
    deepseek: "from-indigo-600 to-blue-700",
    google: "from-green-500 to-emerald-600",
    openai: "from-emerald-500 to-green-600",
    anthropic: "from-amber-500 to-orange-600",
    qwen: "from-purple-500 to-violet-600",
    microsoft: "from-blue-600 to-blue-700",
    ollama: "from-green-600 to-teal-600",
  };

  const gradient = Object.entries(providerColor).find(([k]) =>
    model.provider.toLowerCase().includes(k)
  )?.[1] ?? "from-violet-500 to-purple-600";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
      }}
      onClick={onClick}
    >
      <Card className="group h-full hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden cursor-pointer">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            {model.isNew && (
              <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">NEW</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight line-clamp-2">{model.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {model.provider.split("/")[0]}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {model.contextWindow >= 1000
                    ? `${(model.contextWindow / 1000).toFixed(0)}K`
                    : model.contextWindow}
                </span>
              </div>
              {model.releaseDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{timeAgo(model.releaseDate)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              {model.isFree && <Badge variant="free" className="text-xs">Free</Badge>}
              {model.isOpenSource && <Badge variant="success" className="text-xs">Open</Badge>}
              {model.capabilities.includes("vision") && (
                <Badge variant="info" className="text-xs">Vision</Badge>
              )}
              {model.source === "huggingface" && <Badge variant="secondary" className="text-xs">HF</Badge>}
            </div>
            {model.hfDownloads && model.hfDownloads > 1000 && (
              <p className="text-[10px] text-muted-foreground">↓ {formatNumber(model.hfDownloads)} downloads</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper to get installation instructions
function getModelInstructions(model: AIModel) {
  const isOllama = model.provider === "ollama";
  const modelSlug = isOllama ? model.ollamaSlug : model.openRouterSlug;

  if (isOllama) {
    return {
      title: "Run Locally with Ollama",
      steps: [
        {
          title: "1. Install Ollama",
          description: "Download Ollama from https://ollama.ai",
          command: "# macOS or Windows: Download from ollama.ai",
        },
        {
          title: "2. Pull the Model",
          description: `Download ${model.name}`,
          command: `ollama pull ${modelSlug}`,
        },
        {
          title: "3. Run the Model",
          description: "Start a local server (runs on http://localhost:11434)",
          command: `ollama run ${modelSlug}`,
        },
        {
          title: "4. Use via API",
          description: "Send requests to the local API endpoint",
          command: `curl http://localhost:11434/api/generate -d '{\n  "model": "${modelSlug}",\n  "prompt": "Hello!"\n}'`,
        },
      ],
      features: [
        "✅ Completely free",
        "✅ Runs locally - full privacy",
        "✅ No API keys",
        "✅ Works offline",
      ],
    };
  }

  return {
    title: "Use via OpenRouter API",
    steps: [
      {
        title: "1. Get API Key",
        description: "Sign up at https://openrouter.ai",
        command: "# Get your key from https://openrouter.ai/keys",
      },
      {
        title: "2. Set Environment Variable",
        description: "Store your API key",
        command: 'export OPENROUTER_API_KEY="sk-..."',
      },
      {
        title: "3. Make API Request",
        description: "Use the model ID",
        command: `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${modelSlug}", "messages": [{"role": "user", "content": "Hello!"}]}'`,
      },
    ],
    features: [
      `💰 Input: $${(model.pricing?.prompt || 0).toFixed(6)}/1k tokens`,
      `💰 Output: $${(model.pricing?.completion || 0).toFixed(6)}/1k tokens`,
      "🔑 Requires API key",
      "📡 Cloud-based (instant access)",
    ],
  };
}

interface ModelDetailModalProps {
  model: AIModel;
  onClose: () => void;
  onCopyCommand: (cmd: string) => void;
  copiedCommand: string | null;
}

function ModelDetailModal({
  model,
  onClose,
  onCopyCommand,
  copiedCommand,
}: ModelDetailModalProps) {
  const instructions = getModelInstructions(model);
  const isOllama = model.provider === "ollama";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onCopyCommand(text);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{model.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{model.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          {model.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{model.description}</p>
            </div>
          )}

          {/* Specs */}
          <div>
            <h3 className="font-semibold mb-3">Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-accent/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Context</p>
                <p className="text-lg font-semibold">
                  {model.contextWindow >= 1000
                    ? `${(model.contextWindow / 1000).toFixed(0)}K`
                    : model.contextWindow}
                </p>
              </div>
              <div className="bg-accent/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="text-lg font-semibold capitalize">
                  {model.provider.split("/")[0]}
                </p>
              </div>
              {model.releaseDate && (
                <div className="bg-accent/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Released</p>
                  <p className="text-base font-semibold">{timeAgo(model.releaseDate)}</p>
                  <p className="text-xs text-muted-foreground">{model.releaseDate}</p>
                </div>
              )}
              {model.hfDownloads && model.hfDownloads > 0 && (
                <div className="bg-accent/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">HF Downloads</p>
                  <p className="text-lg font-semibold">{formatNumber(model.hfDownloads)}</p>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {model.isFree && <Badge>Free</Badge>}
              {model.isOpenSource && <Badge variant="success">Open Source</Badge>}
              {model.capabilities.map((cap) => (
                <Badge key={cap} variant="secondary">
                  {cap.replace("-", " ")}
                </Badge>
              ))}
            </div>
          </div>

          {/* Installation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5" />
              <h3 className="font-semibold text-lg">{instructions.title}</h3>
            </div>

            {instructions.features && (
              <div className="bg-accent/30 rounded-lg p-3 mb-4 space-y-1">
                {instructions.features.map((feature) => (
                  <p key={feature} className="text-sm">
                    {feature}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {instructions.steps.map((step, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-muted-foreground">{step.command}</pre>
                  </div>
                  <button
                    onClick={() => copyToClipboard(step.command)}
                    className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    {copiedCommand === step.command ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Command
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-accent/20 border border-border rounded-lg p-4">
            <div className="flex gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
              <h4 className="font-semibold">Next Steps</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>
                {isOllama
                  ? "✅ Once installed, the model will be available locally"
                  : "✅ After setup, you can start making API calls"}
              </li>
              <li>✅ Check the documentation for advanced options</li>
              <li>✅ Explore other {isOllama ? "local" : "API"} models</li>
            </ul>
          </div>

          {/* Resources */}
          <div className="grid grid-cols-2 gap-3">
            {isOllama ? (
              <>
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ollama Website
                </a>
                <a
                  href="https://github.com/jmorganca/ollama"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <Code className="h-4 w-4" />
                  GitHub
                </a>
              </>
            ) : (
              <>
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  OpenRouter
                </a>
                <a
                  href="https://openrouter.ai/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  Docs
                </a>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            onClick={() => {
              const instructions = getModelInstructions(model);
              copyToClipboard(instructions.steps.map((s) => s.command).join("\n\n"));
            }}
            className="flex-1 gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy All Commands
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
