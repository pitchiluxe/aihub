"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Share2, Eye, Code, Zap, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface ArchivedItem {
  id: string;
  name: string;
  type: "skill" | "agent";
  description: string;
  code: string;
  archivedAt: string;
  downloads: number;
  shares: number;
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchivedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "skill" | "agent">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    loadArchivedItems();
  }, []);

  async function loadArchivedItems() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/archive");
      if (!res.ok) throw new Error("Failed to load items");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load archived items");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(item: ArchivedItem) {
    try {
      // Increment download count
      await fetch(`/api/archive?id=${item.id}&action=download`, {
        method: "PATCH",
      });

      // Trigger download
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
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

      // Reload to show updated count
      loadArchivedItems();
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed");
    }
  }

  async function handleShare(item: ArchivedItem) {
    try {
      // Increment share count
      await fetch(`/api/archive?id=${item.id}&action=share`, {
        method: "PATCH",
      });

      const shareUrl = `${window.location.origin}/archive/${item.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied!");

      // Reload to show updated count
      loadArchivedItems();
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Share failed");
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <TopBar />

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Community Archive</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Discover, download, and share AI skills and agents created by the community
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search skills and agents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "skill", "agent"] as const).map(type => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                onClick={() => setFilterType(type)}
                className="capitalize"
              >
                {type === "all" ? "All" : type === "skill" ? "Skills" : "Agents"}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <CardContent className="h-12 mt-4 bg-slate-100 dark:bg-slate-800 rounded" />
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Code className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {searchTerm ? "No items found matching your search" : "No archived items yet"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all cursor-pointer overflow-hidden group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </CardTitle>
                        <Badge
                          variant={item.type === "skill" ? "default" : "secondary"}
                          className="mt-2 capitalize"
                        >
                          {item.type === "skill" ? <Zap className="w-3 h-3 mr-1" /> : <Code className="w-3 h-3 mr-1" />}
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm line-clamp-2 mt-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Download className="w-3 h-3" />
                        <span>{item.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Share2 className="w-3 h-3" />
                        <span>{item.shares}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.archivedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShare(item)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Preview */}
                    {previewId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                      >
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs overflow-auto max-h-40 font-mono">
                          {item.code.slice(0, 500)}...
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Stats Summary */}
        {!isLoading && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{items.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {items.reduce((sum, item) => sum + item.downloads, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {items.reduce((sum, item) => sum + item.shares, 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
