"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsArticle } from "@/types";
import { formatDate, getColorForCategory } from "@/lib/utils";
import { Building2, ExternalLink, TrendingUp, Newspaper, ArrowUpRight } from "lucide-react";

const COMPANIES = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Creator of GPT-4, ChatGPT, Sora, and DALL-E. The world's most valuable AI company.",
    category: "openai" as const,
    color: "#10a37f",
    logo: "🟢",
    founded: "2015",
    hq: "San Francisco, CA",
    models: ["GPT-4o", "GPT-4 Turbo", "GPT-3.5", "o1", "o3"],
    valuation: "$157B",
    tags: ["LLMs", "Multimodal", "ChatGPT", "API"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Safety-focused AI company. Creator of Claude. Constitutional AI pioneers.",
    category: "anthropic" as const,
    color: "#d97706",
    logo: "🟠",
    founded: "2021",
    hq: "San Francisco, CA",
    models: ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"],
    valuation: "$61B",
    tags: ["Safety", "Constitutional AI", "Claude", "MCP"],
  },
  {
    id: "google",
    name: "Google DeepMind",
    description: "AI research powerhouse. Creator of Gemini, AlphaFold, and Bard/Gemini.",
    category: "google" as const,
    color: "#4285f4",
    logo: "🔵",
    founded: "1998 / 2010",
    hq: "Mountain View, CA",
    models: ["Gemini 1.5 Pro", "Gemini Ultra", "Gemma 2"],
    valuation: "Public (GOOGL)",
    tags: ["Research", "Gemini", "AlphaFold", "Multimodal"],
  },
  {
    id: "meta",
    name: "Meta AI",
    description: "Open source AI leader. Creator of Llama models. Democratizing AI access.",
    category: "meta" as const,
    color: "#0866ff",
    logo: "🔷",
    founded: "2004",
    hq: "Menlo Park, CA",
    models: ["Llama 3.1 405B", "Llama 3.2", "Code Llama"],
    valuation: "Public (META)",
    tags: ["Open Source", "Llama", "Research", "Social AI"],
  },
  {
    id: "xai",
    name: "xAI",
    description: "Elon Musk's AI venture. Creator of Grok. Integrated with X/Twitter.",
    category: "xai" as const,
    color: "#000000",
    logo: "⚫",
    founded: "2023",
    hq: "San Francisco, CA",
    models: ["Grok-2", "Grok-1.5"],
    valuation: "$50B",
    tags: ["Grok", "X Integration", "Real-time", "Open Weights"],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "European AI powerhouse. Efficient open-source models. La Plateforme.",
    category: "mistral" as const,
    color: "#ff7000",
    logo: "🟡",
    founded: "2023",
    hq: "Paris, France",
    models: ["Mistral Large", "Mistral 7B", "Mixtral 8x22B"],
    valuation: "$6B",
    tags: ["Open Source", "Efficient", "European AI", "MoE"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Chinese AI lab disrupting the industry with efficient, powerful open-source models.",
    category: "deepseek" as const,
    color: "#1e3a8a",
    logo: "🔹",
    founded: "2023",
    hq: "Hangzhou, China",
    models: ["DeepSeek V3", "DeepSeek-R1", "DeepSeek Coder"],
    valuation: "Private",
    tags: ["Open Source", "Reasoning", "Cost Efficient", "Research"],
  },
  {
    id: "microsoft",
    name: "Microsoft AI",
    description: "OpenAI partner. Azure AI services. GitHub Copilot. Creator of Phi models.",
    category: "all" as const,
    color: "#00a4ef",
    logo: "🪟",
    founded: "1975",
    hq: "Redmond, WA",
    models: ["Phi-4", "Phi-3", "Azure OpenAI"],
    valuation: "Public (MSFT)",
    tags: ["Azure", "Copilot", "Phi Models", "Enterprise"],
  },
];

export default function CompaniesPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news?limit=80")
      .then((r) => r.json())
      .then((d) => setNews(d.articles ?? []))
      .finally(() => setLoading(false));
  }, []);

  function getCompanyNews(category: string): NewsArticle[] {
    return news
      .filter((a) => a.category === category || a.source.toLowerCase().includes(category))
      .slice(0, 4);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Company Tracker" description="Monitor AI company activity in real-time" />
      <div className="flex-1 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COMPANIES.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  activeCompany === company.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setActiveCompany(activeCompany === company.id ? null : company.id)}
              >
                <div className="h-1.5" style={{ backgroundColor: company.color }} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{company.logo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.hq}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: company.color }}>
                      {company.valuation}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{company.description}</p>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Key Models</p>
                    <div className="flex flex-wrap gap-1">
                      {company.models.slice(0, 3).map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {company.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: company.color + "40", color: company.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expanded News */}
              {activeCompany === company.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 md:col-span-2 xl:col-span-4"
                >
                  <Card className="border-2" style={{ borderColor: company.color + "40" }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Newspaper className="h-4 w-4" style={{ color: company.color }} />
                        Latest {company.name} News
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {loading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                          ))}
                        </div>
                      ) : (
                        <>
                          {getCompanyNews(company.id).map((article) => (
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
                          ))}
                          {getCompanyNews(company.id).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              No recent news found for {company.name}.
                            </p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
