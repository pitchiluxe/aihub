"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NewsArticle, AIModel, TrendItem } from "@/types";
import { formatDate, formatNumber, getColorForCategory } from "@/lib/utils";
import {
  TrendingUp, Zap, Brain, Newspaper, ArrowUpRight, ArrowRight,
  Flame, Star, Clock, Activity, Cpu, FlaskConical, Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area,
} from "recharts";

const STAGGER: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function DashboardPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [newsRes, modelsRes, trendsRes] = await Promise.allSettled([
          fetch("/api/news?limit=12").then((r) => r.json()),
          fetch("/api/models?free=true").then((r) => r.json()),
          fetch("/api/trends").then((r) => r.json()),
        ]);

        if (newsRes.status === "fulfilled") setNews(newsRes.value.articles ?? []);
        if (modelsRes.status === "fulfilled") setModels(modelsRes.value.models?.slice(0, 8) ?? []);
        if (trendsRes.status === "fulfilled") setTrends(trendsRes.value.trends?.slice(0, 10) ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const breakingNews = news.filter((n) => n.isBreaking).slice(0, 2);
  const latestNews = news.slice(0, 6);
  const freeModels = models.filter((m) => m.isFree).slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Dashboard" description="The AI Intelligence Command Center" />
      <div className="flex-1 p-6 space-y-6">
        {/* Hero Stats Row */}
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            label="Live News Sources"
            value="9"
            sub="Updating every 5 min"
            icon={<Activity className="h-4 w-4" />}
            color="text-green-500"
            trend={+12}
          />
          <StatCard
            label="Models Available"
            value={models.length > 0 ? formatNumber(models.length) : "…"}
            sub="OpenRouter + Ollama"
            icon={<Cpu className="h-4 w-4" />}
            color="text-violet-500"
            trend={+8}
          />
          <StatCard
            label="Trending Topics"
            value={trends.length > 0 ? String(trends.length) : "…"}
            sub="From today's articles"
            icon={<TrendingUp className="h-4 w-4" />}
            color="text-blue-500"
            trend={+5}
          />
          <StatCard
            label="Research Papers"
            value="∞"
            sub="arXiv + Semantic Scholar"
            icon={<FlaskConical className="h-4 w-4" />}
            color="text-amber-500"
            trend={+22}
          />
        </motion.div>

        {/* Main Grid */}
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Latest News - 2 cols */}
          <motion.div variants={FADE_UP} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    <CardTitle>Latest AI News</CardTitle>
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <Link href="/news">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      All News <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {latestNews.map((article) => (
                      <NewsRow key={article.id} article={article} />
                    ))}
                    {latestNews.length === 0 && (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Loading news from RSS feeds…
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Trending - 1 col */}
          <motion.div variants={FADE_UP}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <CardTitle>Trending Now</CardTitle>
                  </div>
                  <Link href="/trends">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-8 rounded bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trends.slice(0, 8).map((trend, i) => (
                      <TrendRow key={trend.id} trend={trend} rank={i + 1} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Models Row */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                  <CardTitle>Free Models Available Now</CardTitle>
                  <Badge variant="free" className="text-xs">FREE</Badge>
                </div>
                <Link href="/models">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    All Models <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {freeModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Row — Quicklinks */}
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { href: "/agents", icon: Sparkles, label: "AI Agents", desc: "Chat with AI specialists", color: "from-violet-500 to-purple-600" },
            { href: "/graph", icon: Zap, label: "Knowledge Graph", desc: "Explore AI relationships", color: "from-blue-500 to-cyan-600" },
            { href: "/battle", icon: Star, label: "Battle Arena", desc: "Compare models side-by-side", color: "from-orange-500 to-red-600" },
            { href: "/research", icon: Clock, label: "Research", desc: "Latest papers from arXiv", color: "from-green-500 to-emerald-600" },
          ].map((item) => (
            <motion.div key={item.href} variants={FADE_UP}>
              <Link href={item.href}>
                <Card className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground mt-2 group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon, color, trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  trend: number;
}) {
  return (
    <motion.div variants={FADE_UP}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`${color}`}>{icon}</span>
            <span className={`text-xs font-medium ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs font-medium text-foreground/80">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function NewsRow({ article }: { article: NewsArticle }) {
  const color = getColorForCategory(article.category);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors group cursor-pointer"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="h-2 w-2 rounded-full mt-1"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{article.source}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</span>
        </div>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
    </a>
  );
}

function TrendRow({ trend, rank }: { trend: TrendItem; rank: number }) {
  const pct = Math.min((trend.mentions / (trend.mentions + 5)) * 100, 95);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium truncate">{trend.name}</span>
          <span className={`text-xs flex-shrink-0 ml-2 ${trend.change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend.change >= 0 ? "↑" : "↓"} {Math.abs(trend.mentions)}
          </span>
        </div>
        <Progress value={pct} className="h-1" />
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: AIModel }) {
  const providerColors: Record<string, string> = {
    "meta-llama": "bg-blue-500",
    mistralai: "bg-orange-500",
    deepseek: "bg-indigo-600",
    "google": "bg-green-500",
    openai: "bg-emerald-600",
    anthropic: "bg-amber-500",
    qwen: "bg-purple-500",
    microsoft: "bg-blue-600",
  };
  const colorClass = Object.entries(providerColors).find(([k]) =>
    model.provider.toLowerCase().includes(k)
  )?.[1] ?? "bg-violet-500";

  return (
    <Link href="/models">
      <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer group">
        <div className={`h-8 w-8 rounded-md ${colorClass} flex items-center justify-center`}>
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold leading-tight line-clamp-2">{model.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{model.provider.split("/")[0]}</p>
        </div>
        <Badge variant="free" className="text-xs self-start">FREE</Badge>
      </div>
    </Link>
  );
}
