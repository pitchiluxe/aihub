"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpenRouterModel, BattleResult } from "@/types";
import {
  Swords, Send, Trophy, Plus, X, Brain,
  Clock, Zap, Star, RefreshCw, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

const PRESET_BATTLES = [
  { name: "Coding Giants", models: ["openai/gpt-oss-120b:free", "openai/gpt-oss-20b:free"], label: "Code Test" },
  { name: "Free Champions", models: ["openai/gpt-oss-20b:free", "openai/gpt-oss-20b:free"], label: "General Test" },
  { name: "Reasoning Duel", models: ["openai/gpt-oss-120b:free", "openai/gpt-oss-20b:free"], label: "Reasoning Test" },
];

const PROMPT_SUGGESTIONS = [
  "Explain quantum entanglement in simple terms",
  "Write a Python function to find prime numbers",
  "What are the key differences between GPT-4 and Claude 3.5?",
  "Design a system architecture for a real-time chat app",
  "Write a creative short story about an AI that discovers it's conscious",
  "What is the trolley problem and how should AI handle it?",
];

export default function BattlePage() {
  const [freeModels, setFreeModels] = useState<OpenRouterModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<BattleResult[]>([]);
  const [battling, setBattling] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/models?free=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const models = (d.models ?? []) as Array<{ openRouterSlug?: string; name: string }>;
        setFreeModels(
          models
            .filter((m) => m.openRouterSlug)
            .map((m) => ({ id: m.openRouterSlug!, name: m.name } as OpenRouterModel))
            .slice(0, 30)
        );
      });
  }, []);

  function addModel(modelId: string) {
    if (selectedModels.includes(modelId)) return;
    if (selectedModels.length >= 4) {
      toast.error("Maximum 4 models in a battle");
      return;
    }
    setSelectedModels((prev) => [...prev, modelId]);
  }

  function removeModel(modelId: string) {
    setSelectedModels((prev) => prev.filter((m) => m !== modelId));
  }

  function loadPreset(preset: typeof PRESET_BATTLES[0]) {
    setSelectedModels(preset.models);
  }

  async function startBattle() {
    if (selectedModels.length < 2) {
      toast.error("Select at least 2 models to battle");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Enter a prompt to battle with");
      return;
    }

    setBattling(true);
    setResults([]);
    setRatings({});

    const messages = [
      { role: "user" as const, content: prompt.trim() },
    ];

    const battlePromises = selectedModels.map(async (model): Promise<BattleResult> => {
      const start = Date.now();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, provider: "openrouter" }),
        });
        const latency = Date.now() - start;
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        const modelName = freeModels.find((m) => m.id === model)?.name ?? model.split("/").pop() ?? model;
        return {
          modelId: model,
          modelName,
          response: data.content ?? "No response",
          tokensUsed: data.usage?.total_tokens,
          latencyMs: latency,
        };
      } catch (err) {
        const modelName = freeModels.find((m) => m.id === model)?.name ?? model;
        return {
          modelId: model,
          modelName,
          response: "⚠️ Failed to get response from this model.",
          latencyMs: Date.now() - start,
        };
      }
    });

    const results = await Promise.allSettled(battlePromises);
    const settled = results
      .filter((r): r is PromiseFulfilledResult<BattleResult> => r.status === "fulfilled")
      .map((r) => r.value);

    setResults(settled);
    setBattling(false);
  }

  function rateResponse(modelId: string, rating: number) {
    setRatings((prev) => ({ ...prev, [modelId]: rating }));
  }

  const winner = results.length > 0
    ? results.reduce((best, curr) =>
        (ratings[curr.modelId] ?? 0) > (ratings[best.modelId] ?? 0) ? curr : best
      )
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="AI Battle Arena" description="Compare AI model responses side-by-side" />
      <div className="flex-1 p-3 md:p-6 space-y-6">
        {/* Arena Header */}
        <div className="text-center py-4">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 items-center justify-center mb-3">
            <Swords className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">Model Battle Arena</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Run the same prompt through multiple free models. Rate the winner.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                  Select Models ({selectedModels.length}/4)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Presets */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Quick Presets</p>
                  <div className="space-y-1.5">
                    {PRESET_BATTLES.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => loadPreset(preset)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent text-xs transition-all"
                      >
                        <span className="font-medium">{preset.name}</span>
                        <Badge variant="secondary" className="text-xs">{preset.label}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Models */}
                {selectedModels.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Selected</p>
                    {selectedModels.map((modelId) => {
                      const model = freeModels.find((m) => m.id === modelId);
                      return (
                        <div key={modelId} className="flex items-center justify-between px-2.5 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                          <span className="text-xs font-medium truncate">{model?.name ?? modelId.split("/").pop()}</span>
                          <button onClick={() => removeModel(modelId)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Model Picker */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">All Free Models</p>
                  {freeModels.slice(0, 20).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => addModel(model.id)}
                      disabled={selectedModels.includes(model.id) || selectedModels.length >= 4}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedModels.includes(model.id)
                          ? "bg-primary/10 text-primary cursor-default"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                      } disabled:opacity-50`}
                    >
                      {model.name ?? model.id.split("/").pop()}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Battle Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt Input */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Battle Prompt</p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt and watch models compete..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-ring"
                />

                {/* Suggestions */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PROMPT_SUGGESTIONS.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => setPrompt(s)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-full bg-secondary text-xs hover:bg-accent transition-colors"
                    >
                      {s.slice(0, 40)}…
                    </button>
                  ))}
                </div>

                <Button
                  onClick={startBattle}
                  loading={battling}
                  disabled={selectedModels.length < 2 || !prompt.trim()}
                  className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-600 border-0"
                >
                  <Swords className="h-4 w-4" />
                  {battling ? `Battling ${selectedModels.length} models...` : "Start Battle"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {battling && results.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModels.map((modelId) => (
                  <Card key={modelId} className="overflow-hidden">
                    <div className="h-1 bg-muted animate-pulse" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                      <div className="space-y-1.5">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-3 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Winner Banner */}
                  {winner && Object.keys(ratings).length === results.length && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                    >
                      <Trophy className="h-6 w-6 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">🏆 Winner: {winner.modelName}</p>
                        <p className="text-xs text-muted-foreground">
                          Highest community rating in this battle
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((result, i) => (
                      <motion.div
                        key={result.modelId}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className={`overflow-hidden ${
                          winner?.modelId === result.modelId && Object.keys(ratings).length === results.length
                            ? "border-amber-400 dark:border-amber-600 shadow-amber-100 dark:shadow-amber-900/20 shadow-lg"
                            : ""
                        }`}>
                          <div
                            className="h-1"
                            style={{
                              background: `hsl(${(i * 60 + 220) % 360}, 70%, 60%)`,
                            }}
                          />
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold truncate">{result.modelName}</p>
                                {result.latencyMs && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {(result.latencyMs / 1000).toFixed(1)}s
                                    {result.tokensUsed && (
                                      <>
                                        <Zap className="h-2.5 w-2.5 ml-1" />
                                        {result.tokensUsed} tokens
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              {winner?.modelId === result.modelId && Object.keys(ratings).length === results.length && (
                                <Trophy className="h-5 w-5 text-amber-500 flex-shrink-0" />
                              )}
                            </div>

                            <div className="text-xs text-foreground leading-relaxed max-h-48 overflow-y-auto bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                              {result.response}
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">Rate this response:</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => rateResponse(result.modelId, star)}
                                    className={`transition-colors ${
                                      (ratings[result.modelId] ?? 0) >= star
                                        ? "text-amber-400"
                                        : "text-muted-foreground hover:text-amber-300"
                                    }`}
                                  >
                                    <Star className="h-5 w-5 fill-current" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => { setResults([]); setRatings({}); }}
                    className="w-full gap-2 text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New Battle
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
