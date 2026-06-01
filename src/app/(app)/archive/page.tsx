"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download, Share2, Eye, Code, Zap, Search, Calendar,
  Wand2, Lightbulb, Trash2, Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { useArchiveStore, ArchivedItem } from "@/store/archive";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  skill:  { icon: Code,     color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",   label: "Skill" },
  agent:  { icon: Zap,      color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800", label: "Agent" },
  prompt: { icon: Wand2,    color: "text-pink-600",   bg: "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800",   label: "Prompt" },
  idea:   { icon: Lightbulb,color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", label: "Idea" },
};

export default function ArchivePage() {
  const { items, removeItem, incrementDownloads, incrementShares } = useArchiveStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "skill" | "agent" | "prompt" | "idea">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  async function handleDownload(item: ArchivedItem) {
    try {
      incrementDownloads(item.id);
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, format: "zip" }),
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name.replace(/\s+/g, "-").toLowerCase()}-${item.type}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch {
      toast.error("Download failed");
    }
  }

  async function handleShare(item: ArchivedItem) {
    incrementShares(item.id);
    await navigator.clipboard.writeText(`${window.location.origin}/archive/${item.id}`);
    toast.success("Share link copied to clipboard!");
  }

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeFilters = [
    { value: "all", label: `All (${items.length})` },
    { value: "skill",  label: `Skills (${items.filter(i => i.type === "skill").length})` },
    { value: "agent",  label: `Agents (${items.filter(i => i.type === "agent").length})` },
    { value: "prompt", label: `Prompts (${items.filter(i => i.type === "prompt").length})` },
    { value: "idea",   label: `Ideas (${items.filter(i => i.type === "idea").length})` },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Archive" description="Your generated skills, agents, prompts, and ideas — saved locally" />

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your archive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {typeFilters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filterType === f.value ? "default" : "outline"}
                onClick={() => setFilterType(f.value as typeof filterType)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Items", value: items.length },
              { label: "Downloads", value: items.reduce((s, i) => s + i.downloads, 0) },
              { label: "Shares", value: items.reduce((s, i) => s + i.shares, 0) },
              { label: "This Month", value: items.filter(i => new Date(i.archivedAt) > new Date(Date.now() - 30 * 86400000)).length },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your archive is empty</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Generate skills, agents, prompts, or ideas in the Generator — they'll appear here automatically.
            </p>
            <Link href="/generator">
              <Button className="gap-2 ai-gradient border-0">
                <Wand2 className="h-4 w-4" />
                Go to Generator
              </Button>
            </Link>
          </div>
        )}

        {/* No results for filter */}
        {items.length > 0 && filteredItems.length === 0 && (
          <div className="py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No items match your search.</p>
          </div>
        )}

        {/* Grid */}
        {filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredItems.map((item, idx) => {
                const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.skill;
                const Icon = cfg.icon;
                const isExpanded = previewId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="h-full hover:shadow-md transition-all overflow-hidden group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                              {item.name}
                            </CardTitle>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border mt-2 ${cfg.bg} ${cfg.color}`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                            title="Remove from archive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <CardDescription className="text-xs line-clamp-2 mt-2">
                          {item.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {item.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {item.shares}
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.archivedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setPreviewId(isExpanded ? null : item.id)} className="flex-1 gap-1 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            {isExpanded ? "Hide" : "Preview"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(item)} className="gap-1 text-xs">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleShare(item)} className="gap-1 text-xs">
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Preview */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-[#1e1e2e] rounded-lg p-3 overflow-auto max-h-48">
                                <pre className="text-xs font-mono text-[#cdd6f4] whitespace-pre-wrap break-words">
                                  {item.code.slice(0, 800)}
                                  {item.code.length > 800 && "\n\n..."}
                                </pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
