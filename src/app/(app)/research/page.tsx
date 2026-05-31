"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResearchPaper } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Search, ExternalLink, FlaskConical, BookOpen,
  Users, Quote, RefreshCw, ChevronDown,
} from "lucide-react";

const RESEARCH_TOPICS = [
  "large language models", "AI agents", "RAG", "multimodal AI",
  "AI alignment", "reasoning", "fine-tuning", "transformers",
  "AI safety", "embodied AI",
];

export default function ResearchPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("large language models");
  const [activeQuery, setActiveQuery] = useState("large language models");

  async function loadPapers(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setPapers(data.papers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPapers(activeQuery); }, [activeQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveQuery(query);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Research Center" description="Live research from arXiv and Semantic Scholar" />
      <div className="flex-1 p-3 md:p-6 space-y-5">
        {/* Controls */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            placeholder="Search papers: LLMs, agents, alignment, RAG..."
            icon={<Search className="h-3.5 w-3.5" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={loading} className="gap-2 flex-shrink-0">
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        </form>

        {/* Topic pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {RESEARCH_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => { setQuery(topic); setActiveQuery(topic); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeQuery === topic
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {loading ? "Fetching from arXiv and Semantic Scholar…" : `${papers.length} papers found`}
        </p>

        {/* Papers */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
            {papers.length === 0 && (
              <div className="py-20 text-center">
                <FlaskConical className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No papers found. Try a different query.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
      }}
    >
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                  {paper.title}
                </h3>
              </a>
            </div>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Authors */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="truncate">{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ""}</span>
          </div>

          {/* TL;DR */}
          {paper.tldr && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <span className="text-xs font-bold text-primary mt-0.5 flex-shrink-0">TL;DR</span>
              <p className="text-xs text-foreground leading-relaxed">{paper.tldr}</p>
            </div>
          )}

          {/* Abstract */}
          <div>
            <p className={`text-xs text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
              {paper.abstract}
            </p>
            {paper.abstract.length > 300 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
                <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div className="flex items-center gap-3">
              {paper.arxivId && (
                <Badge variant="secondary" className="text-xs font-mono">
                  arXiv:{paper.arxivId.slice(-10)}
                </Badge>
              )}
              {paper.citations !== undefined && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Quote className="h-3 w-3" />
                  {paper.citations.toLocaleString()} citations
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(paper.publishedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
