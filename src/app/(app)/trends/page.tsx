"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendItem } from "@/types";
import { TrendingUp, TrendingDown, Flame, Building2, Brain, Cpu, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, Cell,
} from "recharts";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  model: Brain,
  company: Building2,
  technology: Cpu,
  concept: Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  model: "#8b5cf6",
  company: "#6366f1",
  technology: "#06b6d4",
  concept: "#f59e0b",
};

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trends", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTrends(d.trends ?? []))
      .finally(() => setLoading(false));
  }, []);

  const grouped = trends.reduce<Record<string, TrendItem[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const topTrends = trends.slice(0, 10);
  const maxMentions = Math.max(...trends.map((t) => t.mentions), 1);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Trends Hub" description="What the AI world is talking about right now" />
      <div className="flex-1 p-3 md:p-6 space-y-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Top 10 Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 bg-muted animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topTrends} margin={{ left: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value} mentions`, "Mentions"]}
                  />
                  <Bar dataKey="mentions" radius={[4, 4, 0, 0]}>
                    {topTrends.map((t, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[t.category] ?? "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(grouped).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category] ?? Flame;
            const color = CATEGORY_COLORS[category] ?? "#6366f1";
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <Icon className="h-4 w-4" style={{ color }} />
                      {category}s
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading
                      ? [...Array(4)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                        ))
                      : items.slice(0, 6).map((trend, i) => (
                          <div key={trend.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                                <span className="text-sm font-medium">{trend.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{trend.mentions}x</span>
                                <span
                                  className={`flex items-center gap-0.5 text-xs font-medium ${
                                    trend.change >= 0 ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {trend.change >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {Math.abs(trend.changePercent)}%
                                </span>
                              </div>
                            </div>
                            <Progress
                              value={(trend.mentions / maxMentions) * 100}
                              className="h-1.5"
                              style={{ "--tw-ring-color": color } as React.CSSProperties}
                            />
                          </div>
                        ))}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
