"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, Download, Share2, Sparkles, Code, Zap } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface GeneratedItem {
  id: string;
  name: string;
  type: "skill" | "agent";
  description: string;
  code: string;
  createdAt: Date;
  prompt: string;
  archivedId?: string;
  shareUrl?: string;
}

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<"skill" | "agent">("skill");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);
  const [preview, setPreview] = useState<GeneratedItem | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          prompt,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        name: data.name,
        type: activeTab,
        description: data.description,
        code: data.code,
        createdAt: new Date(),
        prompt,
        archivedId: data.archivedId,
        shareUrl: data.shareUrl,
      };

      setGenerated((prev) => [newItem, ...prev]);
      setPreview(newItem);
      setPrompt("");
      
      if (data.archivedId) {
        toast.success(
          `${activeTab === "skill" ? "Skill" : "Agent"} created & auto-archived! Visit Archive to share.`,
          {
            duration: 4000,
          }
        );
      } else {
        toast.success(`${activeTab === "skill" ? "Skill" : "Agent"} generated!`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(item: GeneratedItem) {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          format: "zip",
        }),
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name}-${item.type}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed");
    }
  }

  async function handleShare(item: GeneratedItem) {
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) throw new Error("Archive failed");

      const data = await response.json();
      const shareUrl = `${window.location.origin}/gallery/${data.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Shared! Link copied to clipboard.");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar 
        title="Skills & Agents Generator" 
        description="Create custom AI skills and agents with natural language prompts"
      />
      
      <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
        {/* Generator Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1 border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">Create {activeTab === "skill" ? "Skill" : "Agent"}</h3>
                
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "skill" | "agent")} className="mb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="skill" className="gap-2">
                      <Code className="h-4 w-4" />
                      Skill
                    </TabsTrigger>
                    <TabsTrigger value="agent" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Agent
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Describe your {activeTab === "skill" ? "skill" : "agent"}
                  </label>
                  <Textarea
                    placeholder={
                      activeTab === "skill"
                        ? "e.g., 'Create a skill that analyzes sentiment in AI news articles using natural language processing'"
                        : "e.g., 'Create an agent that can search for AI research papers, summarize them, and generate insights'"
                    }
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none text-sm"
                    disabled={isGenerating}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={isGenerating}
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </form>

              {/* Recent Generated */}
              {generated.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">RECENT</p>
                  <div className="space-y-2">
                    {generated.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPreview(item)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                          preview?.id === item.id
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-muted-foreground truncate">{item.description.slice(0, 50)}...</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {preview ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={preview.id}
              >
                <Card className="h-full border-2 border-primary/20">
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{preview.name}</h3>
                          <p className="text-sm text-muted-foreground">{preview.description}</p>
                          {preview.archivedId && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                              ✓ Auto-archived and ready to share
                            </p>
                          )}
                        </div>
                        <Badge variant={preview.type === "skill" ? "default" : "secondary"}>
                          {preview.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(preview.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Code Preview */}
                    <div className="flex-1 bg-muted rounded-lg p-4 overflow-auto">
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words">
                        {preview.code.slice(0, 1000)}
                        {preview.code.length > 1000 && "..."}
                      </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      <Button
                        onClick={() => handleDownload(preview)}
                        variant="default"
                        className="flex-1 gap-2"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      {preview.archivedId ? (
                        <Link href="/archive" className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            size="sm"
                          >
                            <Share2 className="h-4 w-4" />
                            View in Archive
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleShare(preview)}
                          variant="outline"
                          className="flex-1 gap-2"
                          size="sm"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      )}
                    </div>

                    {/* Original Prompt */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">PROMPT</p>
                      <p className="text-xs">{preview.prompt}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full border-2 border-dashed border-muted-foreground/20">
                <CardContent className="p-6 flex items-center justify-center h-full text-center">
                  <div>
                    <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Generate a {activeTab === "skill" ? "skill" : "agent"} to see the preview
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
