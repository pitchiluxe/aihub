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
  Search, ExternalLink, FlaskConical,
  Quote, RefreshCw,
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
      const res = await fetch(`/api/research?q=${encodeURIComponent(q)}&limit=50`, { cache: "no-store" });
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
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
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
      }}
    >
      <Card className="group h-full aspect-[2/1] hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col"
        onClick={() => window.open(paper.url, "_blank")}>
        <CardContent className="p-4 space-y-2 flex flex-col h-full">
          {/* Header with icon and external link */}
          <div className="flex items-start justify-between gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
              📄
            </div>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Title - truncated */}
          <h3 className="text-xs font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {paper.title}
          </h3>

          {/* Authors - compact */}
          <div className="text-xs text-muted-foreground line-clamp-1">
            {paper.authors.slice(0, 2).map((a) => a.split(",")[0]).join(", ")}{paper.authors.length > 2 ? "…" : ""}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border mt-auto">
            <div className="flex items-center gap-1">
              <Quote className="h-3 w-3" />
              <span>{(paper.citations ?? 0).toLocaleString()}</span>
            </div>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs truncate">{paper.arxivId?.slice(-6) || "Paper"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
