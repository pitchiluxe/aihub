"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, ArrowRight, Play, Download, Search,
  Bot, Mail, FileText, Globe, Database, Code,
  GitBranch, Sparkles, Clock,
} from "lucide-react";

const WORKFLOWS = [
  {
    id: "1",
    title: "AI Email Responder",
    description: "Automatically draft intelligent email responses using AI. Reads incoming emails, generates context-aware replies.",
    category: "Business Automation",
    difficulty: "simple",
    tools: ["Gmail", "Claude API", "OpenRouter"],
    estimatedTime: "30 min setup",
    steps: [
      { id: "1", title: "Email Trigger", type: "trigger", description: "New email received in Gmail", icon: Mail },
      { id: "2", title: "Extract Context", type: "ai", description: "AI extracts key info from email", icon: Bot },
      { id: "3", title: "Generate Reply", type: "ai", description: "Claude drafts a professional response", icon: Sparkles },
      { id: "4", title: "Review & Send", type: "output", description: "Save as draft or auto-send", icon: Mail },
    ],
    tags: ["email", "automation", "business"],
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "2",
    title: "Research Paper Summarizer",
    description: "Automatically fetch AI papers from arXiv, generate summaries, and post to Notion or Slack.",
    category: "Research Intelligence",
    difficulty: "intermediate",
    tools: ["arXiv API", "GPT-4", "Notion", "Slack"],
    estimatedTime: "1 hour setup",
    steps: [
      { id: "1", title: "arXiv Fetch", type: "trigger", description: "New papers matching your keywords", icon: Database },
      { id: "2", title: "Download PDF", type: "action", description: "Fetch full paper content", icon: FileText },
      { id: "3", title: "AI Summary", type: "ai", description: "Generate 3-bullet TL;DR summary", icon: Bot },
      { id: "4", title: "Store in Notion", type: "output", description: "Save to research database", icon: Database },
      { id: "5", title: "Slack Alert", type: "output", description: "Post digest to #ai-research channel", icon: Globe },
    ],
    tags: ["research", "knowledge", "automation"],
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "3",
    title: "AI Content Generator",
    description: "Transform news articles into social media posts, blog summaries, and newsletters using AI.",
    category: "Content Creation",
    difficulty: "simple",
    tools: ["RSS Feeds", "Claude", "Buffer", "Mailchimp"],
    estimatedTime: "45 min setup",
    steps: [
      { id: "1", title: "RSS Monitor", type: "trigger", description: "Watch AI news feeds for new articles", icon: Globe },
      { id: "2", title: "Relevance Check", type: "condition", description: "AI scores relevance (threshold: 7/10)", icon: Bot },
      { id: "3", title: "Generate Content", type: "ai", description: "Write tweet, LinkedIn post, newsletter blurb", icon: Sparkles },
      { id: "4", title: "Schedule Posts", type: "output", description: "Queue in Buffer for optimal timing", icon: Clock },
    ],
    tags: ["content", "social media", "marketing"],
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "4",
    title: "Code Review Agent",
    description: "Automatically review pull requests with AI. Check for bugs, security issues, and code quality.",
    category: "Developer Tools",
    difficulty: "complex",
    tools: ["GitHub API", "Claude", "Slack"],
    estimatedTime: "2 hours setup",
    steps: [
      { id: "1", title: "PR Webhook", type: "trigger", description: "New PR opened on GitHub", icon: GitBranch },
      { id: "2", title: "Fetch Diff", type: "action", description: "Get changed files and context", icon: Code },
      { id: "3", title: "AI Review", type: "ai", description: "Claude reviews for bugs, security, style", icon: Bot },
      { id: "4", title: "Post Comments", type: "output", description: "Inline PR comments with suggestions", icon: GitBranch },
      { id: "5", title: "Slack Summary", type: "output", description: "Post review summary to team channel", icon: Globe },
    ],
    tags: ["development", "GitHub", "code quality"],
    color: "from-gray-700 to-slate-800",
  },
  {
    id: "5",
    title: "Competitor Intelligence Monitor",
    description: "Track competitor announcements, product launches, and blog posts. Get daily AI-summarized briefings.",
    category: "Business Intelligence",
    difficulty: "intermediate",
    tools: ["Web Scraper", "GPT-4", "Email", "Notion"],
    estimatedTime: "1.5 hours setup",
    steps: [
      { id: "1", title: "Daily Trigger", type: "trigger", description: "Run at 7 AM daily", icon: Clock },
      { id: "2", title: "Web Scrape", type: "action", description: "Fetch competitor blog/news pages", icon: Globe },
      { id: "3", title: "Change Detection", type: "condition", description: "Compare with yesterday's content", icon: GitBranch },
      { id: "4", title: "AI Analysis", type: "ai", description: "Summarize key updates and implications", icon: Bot },
      { id: "5", title: "Email Digest", type: "output", description: "Send briefing to stakeholders", icon: Mail },
    ],
    tags: ["intelligence", "monitoring", "business"],
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "6",
    title: "RAG Document Q&A System",
    description: "Build a production RAG system that lets users query your document library with natural language.",
    category: "AI Infrastructure",
    difficulty: "complex",
    tools: ["Pinecone", "OpenAI Embeddings", "FastAPI", "Next.js"],
    estimatedTime: "4 hours setup",
    steps: [
      { id: "1", title: "Document Ingestion", type: "trigger", description: "Upload documents via API", icon: FileText },
      { id: "2", title: "Chunk & Embed", type: "action", description: "Split into chunks, generate embeddings", icon: Database },
      { id: "3", title: "Store in Pinecone", type: "action", description: "Index vectors with metadata", icon: Database },
      { id: "4", title: "Query Processing", type: "ai", description: "Semantic search + context assembly", icon: Search },
      { id: "5", title: "LLM Response", type: "ai", description: "Generate answer with citations", icon: Bot },
      { id: "6", title: "Stream Output", type: "output", description: "Return streaming response to UI", icon: Globe },
    ],
    tags: ["RAG", "embeddings", "vector DB"],
    color: "from-violet-500 to-purple-700",
  },
];

const STEP_COLORS: Record<string, string> = {
  trigger: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  action: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ai: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  condition: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  output: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const DIFFICULTY_BADGES: Record<string, "success" | "info" | "warning"> = {
  simple: "success",
  intermediate: "info",
  complex: "warning",
};

export default function WorkflowsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = WORKFLOWS.filter(
    (w) =>
      !search.trim() ||
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Workflow Marketplace" description="n8n-inspired AI automation blueprints" />
      <div className="flex-1 p-3 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-9 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} workflows</Badge>
        </div>

        <div className="space-y-4">
          {filtered.map((workflow, i) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${workflow.color}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold">{workflow.title}</h3>
                        <Badge variant={DIFFICULTY_BADGES[workflow.difficulty]} className="text-xs capitalize">
                          {workflow.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{workflow.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{workflow.description}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {workflow.estimatedTime}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {workflow.tools.slice(0, 3).map((tool) => (
                            <span key={tool} className="text-xs px-1.5 py-0.5 bg-secondary rounded-md">{tool}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(expanded === workflow.id ? null : workflow.id)}
                        className="text-xs gap-1"
                      >
                        {expanded === workflow.id ? "Hide" : "View"} Flow
                      </Button>
                      <Button size="sm" className="text-xs gap-1">
                        <Download className="h-3 w-3" />
                        Clone
                      </Button>
                    </div>
                  </div>

                  {/* Workflow Steps Diagram */}
                  {expanded === workflow.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-border overflow-hidden"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Workflow Steps</p>
                      <div className="flex items-start gap-2 flex-wrap">
                        {workflow.steps.map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1 min-w-0">
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${STEP_COLORS[step.type]} text-xs`}>
                                <step.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-xs">{step.title}</p>
                                  <p className="opacity-75 text-xs leading-tight max-w-[120px]">{step.description}</p>
                                </div>
                              </div>
                            </div>
                            {idx < workflow.steps.length - 1 && (
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-2" />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4 flex-wrap">
                        {Object.entries(STEP_COLORS).map(([type, cls]) => (
                          <div key={type} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${cls}`}>
                            <span className="capitalize font-medium">{type}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
