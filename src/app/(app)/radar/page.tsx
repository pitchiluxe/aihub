"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Radar, ArrowUpRight, Clock, RefreshCw, Zap, Activity,
  Bell, BellOff, Flame, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const RADAR_KEYWORDS = [
  "model release", "new model", "announces", "launch", "breakthrough",
  "benchmark", "state-of-the-art", "open source", "GPT-5", "Claude 4",
  "Gemini 2", "Llama 4", "research", "paper",
];

function scoreArticle(article: NewsArticle): number {
  let score = 0;
  const text = (article.title + " " + article.summary).toLowerCase();
  for (const kw of RADAR_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score += 2;
  }
  const age = Date.now() - new Date(article.publishedAt).getTime();
  const hoursOld = age / 3600000;
  if (hoursOld < 1) score += 10;
  else if (hoursOld < 6) score += 5;
  else if (hoursOld < 24) score += 2;
  return score;
}

export default function RadarPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [alertsOn, setAlertsOn] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/news?limit=60", { cache: "no-store" });
      const data = await res.json();
      const scored = (data.articles ?? [] as NewsArticle[]).map((a: NewsArticle) => ({
        ...a,
        radarScore: scoreArticle(a),
      }));
      scored.sort((a: NewsArticle & {radarScore: number}, b: NewsArticle & {radarScore: number}) => b.radarScore - a.radarScore);
      setArticles(scored.slice(0, 20));
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      load();
      toast.success("Radar refreshed", { icon: "📡" });
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const breaking = articles.filter((a) => (a as NewsArticle & {radarScore?: number}).radarScore ?? 0 >= 8);
  const hot = articles.filter((a) => {
    const score = (a as NewsArticle & {radarScore?: number}).radarScore ?? 0;
    return score >= 4 && score < 8;
  });
  const normal = articles.filter((a) => ((a as NewsArticle & {radarScore?: number}).radarScore ?? 0) < 4);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="AI Radar" description="Track new model releases and AI breakthroughs in real-time" />
      <div className="flex-1 p-3 md:p-6 space-y-5">
        {/* Radar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Radar className="h-5 w-5 text-white animate-spin" style={{ animationDuration: "4s" }} />
            </div>
            <div>
              <p className="text-sm font-semibold">Live AI Radar</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                Last scan: {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setAutoRefresh(!autoRefresh);
                toast.success(autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled (1 min)");
              }}
              className="gap-1.5 text-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              {autoRefresh ? "Auto: ON" : "Auto: OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              loading={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Scan Now
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-500">{breaking.length}</span>
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-xs font-medium">Breaking</p>
              <p className="text-xs text-muted-foreground">High priority signals</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-900">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-500">{hot.length}</span>
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-xs font-medium">Hot</p>
              <p className="text-xs text-muted-foreground">Trending signals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{normal.length}</span>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium">Updates</p>
              <p className="text-xs text-muted-foreground">Regular signals</p>
            </CardContent>
          </Card>
        </div>

        {/* Breaking */}
        {breaking.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-red-500 animate-pulse" />
              Breaking Signals
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {breaking.map((article) => (
                <RadarCard key={article.id} article={article} priority="breaking" />
              ))}
            </div>
          </div>
        )}

        {/* Hot */}
        {hot.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-orange-500" />
              Hot Signals
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {hot.map((article) => (
                <RadarCard key={article.id} article={article} priority="hot" />
              ))}
            </div>
          </div>
        )}

        {/* Normal */}
        {normal.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Recent Updates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {normal.slice(0, 8).map((article) => (
                <RadarCard key={article.id} article={article} priority="normal" />
              ))}
            </div>
          </div>
        )}

        {loading && articles.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RadarCard({ article, priority }: { article: NewsArticle; priority: "breaking" | "hot" | "normal" }) {
  const accent = {
    breaking: { border: "border-red-500/60", badge: "bg-red-500/10 text-red-500 border-red-500/30", dot: "bg-red-500 animate-pulse", label: "BREAKING" },
    hot:      { border: "border-orange-500/60", badge: "bg-orange-500/10 text-orange-500 border-orange-500/30", dot: "bg-orange-500", label: "HOT" },
    normal:   { border: "border-border", badge: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", label: "UPDATE" },
  }[priority];

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block group">
      <Card className={`border-2 ${accent.border} hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden`}>
        <CardContent className="p-0">
          {/* Square aspect */}
          <div className="aspect-square flex flex-col p-3.5">
            {/* Top row */}
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${accent.badge}`}>
                {accent.label}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Title — grows to fill */}
            <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-4 flex-1">
              {article.title}
            </p>

            {/* Bottom meta */}
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground font-medium truncate">{article.source}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                <Clock className="h-2.5 w-2.5" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
