"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIRepository } from "@/types";
import { formatNumber } from "@/lib/utils";
import {
  Search,
  Star,
  GitFork,
  ExternalLink,
  GitBranch,
  TrendingUp,
  Filter,
  Download,
  BookOpen,
  Code,
  Zap,
  Package,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "All Repos", icon: Package },
  { id: "agent", label: "Agents", icon: Zap },
  { id: "framework", label: "Frameworks", icon: Code },
  { id: "model", label: "Models", icon: BookOpen },
  { id: "tool", label: "Tools", icon: Package },
  { id: "dataset", label: "Datasets", icon: TrendingUp },
  { id: "tutorial", label: "Tutorials", icon: BookOpen },
  { id: "automation", label: "Automation", icon: Sparkles },
];

const SORT_OPTIONS = [
  { id: "stars", label: "Most Stars" },
  { id: "recent", label: "Recently Updated" },
  { id: "forks", label: "Most Forked" },
  { id: "name", label: "Name (A-Z)" },
];

export default function ReposPage() {
  const [repos, setRepos] = useState<AIRepository[]>([]);
  const [filtered, setFiltered] = useState<AIRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"stars" | "recent" | "forks" | "name">(
    "stars"
  );
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  // Fetch repos on mount
  useEffect(() => {
    async function loadRepos() {
      try {
        setLoading(true);
        const res = await fetch("/api/repos", { cache: "no-store" });
        const data = await res.json();
        const reposData = data.repos || [];
        setRepos(reposData);
        setFiltered(reposData);
      } catch (error) {
        console.error("Failed to fetch repos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRepos();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...repos];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((r) => r.category === selectedCategory);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((r) => {
        const searchText = `${r.name} ${r.owner} ${r.description} ${r.tags.join(
          " "
        )}`.toLowerCase();
        return searchText.includes(searchLower);
      });
    }

    // Sort
    switch (sortBy) {
      case "stars":
        result.sort((a, b) => b.stars - a.stars);
        break;
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case "forks":
        result.sort((a, b) => b.forks - a.forks);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFiltered(result);
  }, [repos, search, selectedCategory, sortBy]);

  const stats = {
    totalRepos: repos.length,
    totalStars: repos.reduce((sum, r) => sum + r.stars, 0),
    totalForks: repos.reduce((sum, r) => sum + r.forks, 0),
    featured: repos.filter((r) => r.featured).length,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-white to-blue-300 bg-clip-text text-transparent">
              RepoHub
            </h1>
            <p className="text-gray-400">
              Discover the best AI repositories from GitHub and beyond
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              {
                label: "Repositories",
                value: stats.totalRepos,
                icon: Package,
              },
              {
                label: "Total Stars",
                value: formatNumber(stats.totalStars),
                icon: Star,
              },
              {
                label: "Total Forks",
                value: formatNumber(stats.totalForks),
                icon: GitFork,
              },
              {
                label: "Featured",
                value: stats.featured,
                icon: Sparkles,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
                <div className="text-lg font-bold">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <Input
              placeholder="Search repositories by name, owner, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Category
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-600 text-white border border-blue-500"
                        : "bg-white/5 border border-white/10 text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-3">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Sort By
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((sort) => (
                <motion.button
                  key={sort.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy(sort.id as any)}
                  className={`px-3 py-2 rounded-lg transition-all text-sm ${
                    sortBy === sort.id
                      ? "bg-blue-600 text-white border border-blue-500"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:border-white/20"
                  }`}
                >
                  {sort.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {search && (
            <div className="text-xs text-gray-400">
              Found <span className="text-blue-400 font-semibold">{filtered.length}</span> repositories
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-lg aspect-square animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Repos Grid */}
        {!loading && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full text-center py-16"
                >
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No repositories found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Try adjusting your filters or search terms
                  </p>
                </motion.div>
              ) : (
                filtered.map((repo, idx) => (
                  <motion.div
                    key={repo.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Card
                      className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-all cursor-pointer group overflow-hidden aspect-square flex flex-col"
                      onClick={() =>
                        setExpandedRepo(
                          expandedRepo === repo.id ? null : repo.id
                        )
                      }
                    >
                      <CardContent className="p-4 flex flex-col h-full overflow-y-auto">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                                {repo.name}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">
                                {repo.owner}
                              </p>
                            </div>
                            {repo.featured && (
                              <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            )}
                          </div>

                          <p className="text-xs text-gray-300 mb-3 line-clamp-3">
                            {repo.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="outline" className="bg-white/5 text-xs">
                              {repo.category}
                            </Badge>
                            {repo.language && (
                              <Badge variant="outline" className="bg-white/5 text-xs">
                                {repo.language}
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          {repo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mb-3">
                              {repo.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {repo.tags.length > 3 && (
                                <span className="text-xs text-gray-500 px-1.5 py-0.5">
                                  +{repo.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stats Footer */}
                        <div className="border-t border-white/10 pt-2 mb-2">
                          <div className="flex items-center gap-2 justify-between text-xs">
                            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="font-semibold">
                                {formatNumber(repo.stars)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                              <GitFork className="w-3 h-3 text-blue-400" />
                              <span className="font-semibold">
                                {formatNumber(repo.forks)}
                              </span>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                                expandedRepo === repo.id ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Info */}
                        <AnimatePresence>
                          {expandedRepo === repo.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-white/10 mt-2 pt-2"
                            >
                              <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                <div className="bg-white/5 rounded p-1.5">
                                  <div className="text-gray-400 text-xs">Updated</div>
                                  <div className="font-bold text-white text-xs">
                                    {new Date(repo.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="bg-white/5 rounded p-1.5">
                                  <div className="text-gray-400 text-xs">Platform</div>
                                  <div className="font-bold text-white text-xs">
                                    {repo.platform}
                                  </div>
                                </div>
                              </div>

                              <a
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open
                              </a>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
