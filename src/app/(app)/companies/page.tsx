"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Building2, ExternalLink, TrendingUp, Newspaper, ArrowUpRight,
  RefreshCw, Sparkles, TrendingDown, Minus, Zap,
} from "lucide-react";
import toast from "react-hot-toast";

// Static base: identity data that never changes
const COMPANY_BASE: Record<string, { color: string; logo: string; hq: string; founded: string; category: string }> = {
  openai:          { color: "#10a37f", logo: "🟢", hq: "San Francisco, CA", founded: "2015", category: "openai" },
  "anthropic":     { color: "#d97706", logo: "🟠", hq: "San Francisco, CA", founded: "2021", category: "anthropic" },
  "google-deepmind":{ color: "#4285f4", logo: "🔵", hq: "Mountain View, CA", founded: "2010", category: "google" },
  "meta-ai":       { color: "#0866ff", logo: "🔷", hq: "Menlo Park, CA",    founded: "2004", category: "meta" },
  xai:             { color: "#888888", logo: "⚫", hq: "San Francisco, CA", founded: "2023", category: "xai" },
  mistral:         { color: "#ff7000", logo: "🟡", hq: "Paris, France",     founded: "2023", category: "mistral" },
  deepseek:        { color: "#1e3a8a", logo: "🔹", hq: "Hangzhou, China",   founded: "2023", category: "deepseek" },
  microsoft:       { color: "#00a4ef", logo: "🪟", hq: "Redmond, WA",       founded: "1975", category: "all" },
};

interface AICompany {
  id: string;
  name: string;
  tagline: string;
  latestModel: string;
  keyDevelopment: string;
  valuation: string;
  momentum: "rising" | "stable" | "mixed";
  focus: string[];
}

const MOMENTUM_CONFIG = {
  rising: { icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Rising" },
  stable: { icon: Minus,        color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/30",       label: "Stable" },
  mixed:  { icon: TrendingDown, color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/30",     label: "Mixed"  },
};

export default function CompaniesPage() {
  const [companies, setCompanies]       = useState<AICompany[]>([]);
  const [news, setNews]                 = useState<NewsArticle[]>([]);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [refreshingAI, setRefreshingAI] = useState(false);
  const [generatedAt, setGeneratedAt]   = useState<string | null>(null);

  async function loadAIData(showToast = false) {
    setRefreshingAI(true);
    try {
      const res = await fetch("/api/companies", { cache: "no-store" });
      const data = await res.json();
      if (data.companies?.length) {
        setCompanies(data.companies);
        setGeneratedAt(data.generatedAt ?? null);
        if (showToast) toast.success("Company intel refreshed by AI!");
      }
    } catch {
      if (showToast) toast.error("Failed to refresh — try again");
    } finally {
      setRefreshingAI(false);
    }
  }

  useEffect(() => {
    // Load AI data + news in parallel
    Promise.all([
      loadAIData(),
      fetch("/api/news?limit=80", { cache: "no-store" })
        .then(r => r.json())
        .then(d => setNews(d.articles ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  function getCompanyNews(category: string): NewsArticle[] {
    return news
      .filter(a => a.category === category || a.source.toLowerCase().includes(category))
      .slice(0, 4);
  }

  const skeletons = Array.from({ length: 8 });

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Company Tracker" description="AI-powered real-time intelligence on leading AI companies" />

      <div className="flex-1 p-3 md:p-6 space-y-5">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Generated Intelligence</span>
            {generatedAt && (
              <span className="text-xs text-muted-foreground">
                · Updated {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAIData(true)}
            disabled={refreshingAI}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingAI ? "animate-spin" : ""}`} />
            Refresh Intel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? skeletons.map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))
            : companies.map((company, i) => {
                const base = COMPANY_BASE[company.id] ?? { color: "#888", logo: "🤖", hq: "—", founded: "—", category: company.id };
                const momentum = MOMENTUM_CONFIG[company.momentum] ?? MOMENTUM_CONFIG.stable;
                const MomentumIcon = momentum.icon;
                const companyNews = getCompanyNews(base.category);

                return (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                        activeCompany === company.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setActiveCompany(activeCompany === company.id ? null : company.id)}
                    >
                      <div className="h-1.5" style={{ backgroundColor: base.color }} />
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl flex-shrink-0">{base.logo}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{company.name}</p>
                            <p className="text-[10px] text-muted-foreground">{base.hq}</p>
                          </div>
                          <span className="text-xs font-bold" style={{ color: base.color }}>
                            {company.valuation}
                          </span>
                        </div>

                        {/* AI tagline */}
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{company.tagline}</p>

                        {/* Latest model */}
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{company.latestModel}</span>
                        </div>

                        {/* Key development */}
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Latest</p>
                          <p className="text-xs leading-snug line-clamp-2">{company.keyDevelopment}</p>
                        </div>

                        {/* Momentum + focus tags */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${momentum.bg} ${momentum.color}`}>
                            <MomentumIcon className="h-2.5 w-2.5" />
                            {momentum.label}
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {company.focus.slice(0, 2).map(f => (
                              <Badge key={f} variant="outline" className="text-[9px] px-1 py-0"
                                style={{ borderColor: base.color + "50", color: base.color }}>
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expanded news panel */}
                    <AnimatePresence>
                      {activeCompany === company.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 overflow-hidden"
                        >
                          <Card className="border-2" style={{ borderColor: base.color + "40" }}>
                            <CardHeader className="pb-3 pt-4 px-4">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Newspaper className="h-4 w-4" style={{ color: base.color }} />
                                Latest {company.name} News
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-2">
                              {companyNews.length > 0 ? companyNews.map(article => (
                                <a
                                  key={article.id}
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium group-hover:text-primary transition-colors line-clamp-2">
                                      {article.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(article.publishedAt)}</p>
                                  </div>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                                </a>
                              )) : (
                                <p className="text-xs text-muted-foreground text-center py-3">No recent news found.</p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
