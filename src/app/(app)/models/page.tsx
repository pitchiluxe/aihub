"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIModel } from "@/types";
import { formatNumber } from "@/lib/utils";
import { useStore } from "@/store";
import {
  Search, Brain, Filter, ExternalLink, Cpu, Sparkles,
  ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import Link from "next/link";

const PROVIDERS = ["all", "meta-llama", "mistralai", "deepseek", "google", "openai", "anthropic", "qwen", "microsoft", "ollama"];

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [filtered, setFiltered] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "context" | "provider">("context");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { selectedProvider, setSelectedProvider, freeOnly, setFreeOnly } = useStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        setModels(data.models ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let result = [...models];
    if (freeOnly) result = result.filter((m) => m.isFree);
    if (selectedProvider !== "all") {
      result = result.filter((m) => m.provider.toLowerCase().includes(selectedProvider));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      if (sortBy === "name") { va = a.name; vb = b.name; }
      else if (sortBy === "context") { va = a.contextWindow; vb = b.contextWindow; }
      else if (sortBy === "provider") { va = a.provider; vb = b.provider; }
      if (sortDir === "asc") return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
    setFiltered(result);
  }, [models, freeOnly, selectedProvider, search, sortBy, sortDir]);

  const freeCount = models.filter((m) => m.isFree).length;
  const openSourceCount = models.filter((m) => m.isOpenSource).length;

  function toggleSort(col: "name" | "context" | "provider") {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Models Hub" description="Explore AI models from OpenRouter and Ollama" />
      <div className="flex-1 p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Models", value: loading ? "…" : formatNumber(models.length), sub: "OpenRouter + Ollama", color: "text-violet-500" },
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

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search models by name, provider, ID..."
            icon={<Search className="h-3.5 w-3.5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button
            variant={freeOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFreeOnly(!freeOnly)}
            className="gap-2 flex-shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Free Only
          </Button>
        </div>

        {/* Provider Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedProvider === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {p === "all" ? "All Providers" : p.split("-")[0] + (p.includes("-") ? " AI" : "")}
            </button>
          ))}
        </div>

        <Tabs defaultValue="grid">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${filtered.length} models`}
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
                  <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
              >
                {filtered.slice(0, 60).map((model) => (
                  <ModelGridCard key={model.id} model={model} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        { key: "name", label: "Model" },
                        { key: "provider", label: "Provider" },
                        { key: "context", label: "Context" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => toggleSort(col.key as "name" | "context" | "provider")}
                        >
                          <span className="flex items-center gap-1">
                            {col.label}
                            {sortBy === col.key ? (
                              sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            ) : null}
                          </span>
                        </th>
                      ))}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Capabilities</th>
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
                      : filtered.slice(0, 80).map((model) => (
                          <tr
                            key={model.id}
                            className="border-b border-border hover:bg-accent/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium max-w-xs">
                              <div className="truncate" title={model.name}>{model.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{model.id}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground capitalize">
                              {model.provider.split("/")[0]}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              {model.contextWindow >= 1000
                                ? `${(model.contextWindow / 1000).toFixed(0)}K`
                                : model.contextWindow}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {model.capabilities.slice(0, 2).map((c) => (
                                  <Badge key={c} variant="secondary" className="text-xs capitalize">
                                    {c.replace("-", " ")}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {model.isFree && <Badge variant="free" className="text-xs">Free</Badge>}
                                {model.isOpenSource && <Badge variant="success" className="text-xs">Open</Badge>}
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {filtered.length > 60 && (
          <p className="text-center text-sm text-muted-foreground">
            Showing 60 of {filtered.length} models. Use filters to narrow results.
          </p>
        )}
      </div>
    </div>
  );
}

function ModelGridCard({ model }: { model: AIModel }) {
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
    >
      <Card className="group h-full hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <Brain className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight line-clamp-2">{model.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {model.provider.split("/")[0]}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {model.contextWindow >= 1000
                  ? `${(model.contextWindow / 1000).toFixed(0)}K ctx`
                  : `${model.contextWindow} ctx`}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {model.isFree && <Badge variant="free" className="text-xs">Free</Badge>}
              {model.isOpenSource && <Badge variant="success" className="text-xs">Open</Badge>}
              {model.capabilities.includes("vision") && (
                <Badge variant="info" className="text-xs">Vision</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
