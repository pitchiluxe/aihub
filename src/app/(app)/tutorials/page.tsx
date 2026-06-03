"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap, Clock, BookOpen, Play, Code, Bot, Zap,
  Search, Brain, ChevronRight, X, CheckCircle, Circle,
  ArrowLeft, ArrowRight, Copy, Check, Sparkles, Loader2, Trophy, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface TutorialStep {
  title: string;
  explanation: string;
  code?: string;
  language?: string;
  tip?: string;
}

interface Tutorial {
  id: string;
  title: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  duration: number;
  tags: string[];
  description: string;
  icon: string;
  color: string;
  steps: TutorialStep[];
}

export default function TutorialsPage() {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [selectedLevel, setSelectedLevel] = useState<"all" | "beginner" | "intermediate" | "advanced" | "expert">("all");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiExplaining, setAiExplaining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loadingTutorials, setLoadingTutorials] = useState(false);

  async function fetchTutorials(category: string, level: string, q?: string) {
    setLoadingTutorials(true);
    try {
      const params = new URLSearchParams({ category, level });
      if (q) params.set("q", q);
      const res = await fetch(`/api/tutorials?${params.toString()}`);
      const data = await res.json();
      if (data.tutorials?.length > 0) setTutorials(data.tutorials);
    } catch { toast.error("Failed to load tutorials"); }
    finally { setLoadingTutorials(false); }
  }

  useEffect(() => { fetchTutorials(selectedCategory, selectedLevel); }, [selectedCategory, selectedLevel]);

  const filteredTutorials = tutorials.filter(t => {
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function openTutorial(tutorial: Tutorial) {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setAiExplanation("");
  }

  function closeTutorial() {
    setActiveTutorial(null);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setAiExplanation("");
  }

  function markStepComplete() {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setAiExplanation("");
    } else {
      toast.success("🎉 Tutorial complete! Well done.", { duration: 4000 });
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  }

  async function askAIToExplain() {
    if (!activeTutorial) return;
    const step = activeTutorial.steps[currentStep];
    setAiExplaining(true);
    setAiExplanation("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [
            {
              role: "system",
              content: `You are an expert, patient AI tutor specializing in AI development. Your job is to explain concepts clearly and make them exciting to learn.

**How to teach:**
- Explain the concept in simple, clear language (2-3 sentences max)
- Use an analogy or real-world example
- Avoid jargon; if you must use technical terms, explain them
- End with a practical tip or next step
- Be encouraging and enthusiastic
- Make it memorable and fun to learn

**Example good response:**
"Think of RAG like a student who can look up information in a textbook before answering a question. Instead of trying to remember everything, the AI searches your documents first, then gives an answer based on what it found. This way, it's accurate and up-to-date!"

**Important:** Your explanations should be better than just reading the text — make people understand WHY it matters and HOW to use it.`,
            },
            {
              role: "user",
              content: `Explain this concept from the tutorial "${activeTutorial.title}" — step "${step.title}":\n\n${step.explanation}${step.code ? `\n\nCode example:\n\`\`\`\n${step.code}\n\`\`\`` : ""}

Make it clear, engaging, and practical. Help me understand WHY this matters.`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get explanation");
      }

      const data = await res.json();
      if (!data.content) {
        throw new Error("No content returned from AI");
      }
      setAiExplanation(data.content);
    } catch (err) {
      const errorText = String(err);
      const baseExplanation = `📚 **${step.title}**\n\n${step.explanation}${step.tip ? `\n\n💡 **Tip:** ${step.tip}` : ""}`;
      
      if (errorText.includes("All models failed") || errorText.includes("rate-limited")) {
        toast.error("⏳ AI models are rate-limited. Showing text explanation.");
        setAiExplanation(baseExplanation);
      } else if (errorText.includes("API key")) {
        toast.error("🔑 API key not configured. Using text explanation.");
        setAiExplanation(baseExplanation);
      } else if (errorText.includes("Ollama")) {
        toast.error("🖥️ Ollama not running. Using text explanation.");
        setAiExplanation(baseExplanation);
      } else {
        toast.error("AI tutor temporarily unavailable. Showing text explanation.");
        setAiExplanation(baseExplanation);
      }
    } finally {
      setAiExplaining(false);
    }
  }

  const CATEGORIES = [
    { id: "general",            label: "All",        icon: BookOpen },
    { id: "prompt-engineering", label: "Prompts",    icon: Search },
    { id: "agent-development",  label: "Agents",     icon: Bot },
    { id: "rag",                label: "RAG",        icon: Search },
    { id: "mcp",                label: "MCP",        icon: Zap },
    { id: "fine-tuning",        label: "Fine-Tuning",icon: Sparkles },
    { id: "langchain",          label: "LangChain",  icon: Code },
    { id: "openrouter",         label: "OpenRouter", icon: Brain },
    { id: "ai-apps",            label: "AI Apps",    icon: Trophy },
  ];

  // ── Tutorial Reader ────────────────────────────────────────────────────
  if (activeTutorial) {
    const step = activeTutorial.steps[currentStep];
    const progress = ((completedSteps.size) / activeTutorial.steps.length) * 100;
    const isLastStep = currentStep === activeTutorial.steps.length - 1;
    const isStepDone = completedSteps.has(currentStep);

    return (
      <div className="flex flex-col h-screen">
        <TopBar title={activeTutorial.title} description={`Step ${currentStep + 1} of ${activeTutorial.steps.length}`} />

        <div className="flex flex-1 overflow-hidden">
          {/* Step Navigation Sidebar */}
          <div className="w-64 border-r border-border flex flex-col flex-shrink-0 bg-muted/20">
            <div className="p-4 border-b border-border">
              <button onClick={closeTutorial} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
                <ArrowLeft className="h-4 w-4" />
                All Tutorials
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{activeTutorial.icon}</span>
                <p className="text-sm font-semibold leading-tight">{activeTutorial.title}</p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{completedSteps.size}/{activeTutorial.steps.length} steps done</p>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {activeTutorial.steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentStep(i); setAiExplanation(""); }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      i === currentStep ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {completedSteps.has(i)
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <Circle className={`h-4 w-4 ${i === currentStep ? "text-primary" : "text-muted-foreground/40"}`} />}
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-snug">{s.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <ScrollArea className="flex-1">
            <div className="max-w-2xl mx-auto p-8 space-y-6">
              {/* Step Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step {currentStep + 1} of {activeTutorial.steps.length}
                  </span>
                  {isStepDone && <Badge variant="default" className="text-xs">Completed</Badge>}
                </div>
                <h2 className="text-2xl font-bold">{step.title}</h2>
              </div>

              {/* Explanation */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed text-foreground/90">{step.explanation}</p>
              </div>

              {/* Code Block */}
              {step.code && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                    <span className="text-xs font-mono text-muted-foreground">{step.language || "code"}</span>
                    <button onClick={() => copyCode(step.code!)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <><Check className="h-3.5 w-3.5 text-green-500"/>Copied!</> : <><Copy className="h-3.5 w-3.5"/>Copy</>}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#1e1e2e] text-[#cdd6f4] text-sm font-mono overflow-x-auto leading-relaxed">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {/* Tip */}
              {step.tip && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{step.tip}</p>
                </div>
              )}

              {/* AI Explanation */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Tutor</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={askAIToExplain} disabled={aiExplaining} className="gap-1.5 text-xs h-7">
                    {aiExplaining ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}
                    {aiExplaining ? "Explaining..." : aiExplanation ? "Re-explain" : "Explain this step"}
                  </Button>
                </div>
                {aiExplanation ? (
                  <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">{aiExplanation}</div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center py-8">
                    Click &ldquo;Explain this step&rdquo; to get a simplified AI explanation
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  onClick={markStepComplete}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isLastStep ? (
                    <>
                      <Trophy className="h-4 w-4" />
                      Complete Tutorial
                    </>
                  ) : (
                    <>
                      Mark & Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // ── Tutorial List ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Tutorials" description="Learn AI, agents, prompts, and advanced techniques" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Search & Filters */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Category Tabs */}
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Level Filter */}
            <div className="flex gap-2 flex-wrap">
              {["all", "beginner", "intermediate", "advanced", "expert"].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level as any)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedLevel === level
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:border-primary/50"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Header + Refresh */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {loadingTutorials
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating fresh AI tutorials…</>
                : <><Sparkles className="h-3.5 w-3.5 text-primary" /> {filteredTutorials.length} AI-generated tutorials · Live</>}
            </div>
            <button
              onClick={() => fetchTutorials(selectedCategory, selectedLevel, searchQuery || undefined)}
              disabled={loadingTutorials}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 transition-all disabled:opacity-50"
            >
              <Loader2 className={`h-3 w-3 ${loadingTutorials ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>

          {/* Loading skeletons */}
          {loadingTutorials && tutorials.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {/* Tutorials Grid */}
          {!loadingTutorials || tutorials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTutorials.map((tutorial, idx) => (
                  <motion.div
                    key={tutorial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="h-full cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group" onClick={() => openTutorial(tutorial)}>
                      <CardContent className="p-5 space-y-3 h-full flex flex-col">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{tutorial.icon}</span>
                          <Badge variant="outline" className="text-xs">{tutorial.level}</Badge>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{tutorial.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tutorial.description}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{tutorial.duration} min</div>
                          <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{tutorial.steps.length} steps</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTutorials.length === 0 && !loadingTutorials && (
                <div className="col-span-3 text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tutorials match your search.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
