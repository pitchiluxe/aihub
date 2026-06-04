"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaygroundStore, TEMPLATES, PlaygroundProject, ProjectType, ProjectLanguage } from "@/store/playground";
import {
  Code, Play, Save, Trash2, Plus, Copy, Check, Download,
  BookOpen, Sparkles, Clock, FolderOpen, ChevronRight, Bot,
  Zap, Search, GitBranch, X, Loader2, Shuffle, Wand2, RefreshCw,
  Share2, Eye, EyeOff, ArrowDownToLine,
} from "lucide-react";
import toast from "react-hot-toast";

const TYPE_ICONS: Record<ProjectType, React.ElementType> = {
  chatbot: Bot, agent: Sparkles, rag: Search, workflow: Zap, api: GitBranch, custom: Code,
};
const TYPE_COLORS: Record<ProjectType, string> = {
  chatbot: "from-blue-500 to-blue-600",
  agent:   "from-violet-500 to-purple-600",
  rag:     "from-green-500 to-emerald-600",
  workflow:"from-amber-500 to-orange-600",
  api:     "from-cyan-500 to-blue-600",
  custom:  "from-gray-600 to-gray-700",
};
const LANG_COLORS: Record<ProjectLanguage, string> = {
  typescript: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  python:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  javascript: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function PlaygroundPage() {
  const { projects, activeProjectId, setActiveProject, saveProject, updateProject, deleteProject, getProject } = usePlaygroundStore();
  const [editingProject, setEditingProject] = useState<PlaygroundProject | null>(null);
  const [newProject, setNewProject]         = useState(false);
  const [newForm, setNewForm]               = useState({ name: "", description: "", type: "chatbot" as ProjectType, language: "typescript" as ProjectLanguage });
  const [copied, setCopied]                 = useState(false);
  const [running, setRunning]               = useState(false);
  const [runOutput, setRunOutput]           = useState<string | null>(null);
  const [aiHelp, setAiHelp]                 = useState(false);
  const [aiPrompt, setAiPrompt]             = useState("");
  const [aiResponse, setAiResponse]         = useState("");
  const [aiLoading, setAiLoading]           = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [copiedProjectId, setCopiedProjectId]     = useState<string | null>(null);
  const [importBanner, setImportBanner]           = useState<PlaygroundProject | null>(null);

  // Auto-import from share URL (?import=base64)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("import");
    if (!encoded) return;
    try {
      const decoded = JSON.parse(atob(encoded)) as PlaygroundProject;
      if (decoded?.name && decoded?.code) setImportBanner(decoded);
    } catch { /**/ }
    // Clean URL without reloading
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  function shareProject(project: PlaygroundProject) {
    const payload = btoa(JSON.stringify({
      name: project.name,
      description: project.description,
      type: project.type,
      language: project.language,
      code: project.code,
      model: project.model,
      tags: project.tags,
    }));
    const url = `${window.location.origin}/playground?import=${payload}`;
    navigator.clipboard.writeText(url);
    setCopiedProjectId(project.id);
    toast.success("Share link copied — anyone with the link can import this project!");
    setTimeout(() => setCopiedProjectId(null), 2500);
  }

  function exportProject(project: PlaygroundProject) {
    const ext = project.language === "python" ? "py" : project.language === "typescript" ? "ts" : "js";
    const blob = new Blob([project.code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, "_").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported as .${ext}`);
  }

  function importSharedProject(project: PlaygroundProject) {
    saveProject({
      name: project.name,
      description: project.description,
      type: project.type,
      language: project.language,
      code: project.code,
      model: project.model,
      tags: project.tags,
    });
    setImportBanner(null);
    toast.success(`"${project.name}" imported to your projects!`);
  }

  // ── AI Sample Generator ────────────────────────────────────────────────
  interface AISample {
    id: string;
    name: string;
    description: string;
    type: ProjectType;
    language: ProjectLanguage;
    tags: string[];
    code: string;
    topic: string;
  }
  const [aiSamples, setAiSamples]           = useState<AISample[]>([]);
  const [generatingSample, setGeneratingSample] = useState(false);
  const [sampleConfig, setSampleConfig]     = useState<{ type: ProjectType; language: ProjectLanguage; topic: string }>({
    type: "chatbot", language: "typescript", topic: "",
  });

  const RANDOM_TOPICS: { topic: string; type: ProjectType; language: ProjectLanguage }[] = [
    { topic: "Sentiment analysis API that classifies customer reviews", type: "api", language: "typescript" },
    { topic: "GitHub PR code reviewer that gives detailed feedback", type: "agent", language: "typescript" },
    { topic: "PDF summarizer that extracts key takeaways", type: "rag", language: "python" },
    { topic: "Email classifier and auto-responder", type: "workflow", language: "python" },
    { topic: "SQL query generator from natural language", type: "chatbot", language: "python" },
    { topic: "Meeting transcript summarizer with action items", type: "workflow", language: "typescript" },
    { topic: "Multi-turn customer support chatbot with memory", type: "chatbot", language: "typescript" },
    { topic: "Web scraper with AI content extraction", type: "agent", language: "python" },
    { topic: "Resume screener and ranking system", type: "workflow", language: "python" },
    { topic: "Real-time news summarizer with category tags", type: "api", language: "typescript" },
    { topic: "Code documentation generator from source files", type: "agent", language: "python" },
    { topic: "Competitor analysis tool using web search", type: "agent", language: "typescript" },
    { topic: "AI flashcard generator from study notes", type: "custom", language: "typescript" },
    { topic: "Streaming chatbot with tool use and citations", type: "chatbot", language: "typescript" },
    { topic: "Document comparison and diff highlighter", type: "rag", language: "python" },
    { topic: "Social media post generator with brand voice", type: "workflow", language: "javascript" },
    { topic: "Bug report analyzer and fix suggester", type: "agent", language: "typescript" },
    { topic: "Product description generator from specs", type: "api", language: "python" },
  ];

  async function generateSample(randomize = false) {
    setGeneratingSample(true);
    const cfg = randomize
      ? RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)]
      : sampleConfig;
    const topic = randomize ? cfg.topic : (sampleConfig.topic.trim() || `A ${sampleConfig.type} using AI`);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [
            {
              role: "system",
              content: `You are an expert AI developer. Generate a complete, production-quality ${cfg.language} code sample for the given topic.

Return ONLY valid JSON with this exact shape (no markdown fences, no extra text):
{
  "name": "Short descriptive project name (3-5 words)",
  "description": "One sentence describing what it does and why it's useful",
  "tags": ["tag1", "tag2", "tag3"],
  "code": "// full working code here as a single string with \\n for newlines"
}

Code requirements:
- Complete and runnable — not pseudocode or stubs
- Well-commented, explaining WHY not just WHAT
- Uses OpenRouter API at https://openrouter.ai/api/v1 with model openai/gpt-oss-20b:free
- Includes realistic example usage at the bottom
- Production patterns: error handling, types, clean structure
- Between 80-200 lines of real code
- Makes the AI integration genuinely useful for the described task`,
            },
            {
              role: "user",
              content: `Generate a ${cfg.language} ${cfg.type} sample for: ${topic}`,
            },
          ],
        }),
      });
      const data = await res.json();
      let parsed: { name?: string; description?: string; tags?: string[]; code?: string } = {};
      try {
        const match = (data.content ?? "").match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch { /**/ }

      if (!parsed.code) throw new Error("No code generated");

      const sample: AISample = {
        id: `ai-${Date.now()}`,
        name: parsed.name ?? topic.slice(0, 40),
        description: parsed.description ?? `AI-generated ${cfg.type} in ${cfg.language}`,
        type: cfg.type,
        language: cfg.language,
        tags: parsed.tags ?? [cfg.type, cfg.language],
        code: parsed.code,
        topic,
      };
      setAiSamples(prev => [sample, ...prev].slice(0, 6));
      if (randomize) setSampleConfig({ type: cfg.type, language: cfg.language, topic: cfg.topic });
      toast.success(`Generated: ${sample.name}`);
    } catch {
      toast.error("Generation failed — try again");
    } finally {
      setGeneratingSample(false);
    }
  }

  function loadAiSample(sample: AISample) {
    setEditingProject({
      id: `draft-${Date.now()}`,
      name: sample.name,
      description: sample.description,
      type: sample.type,
      language: sample.language,
      code: sample.code,
      model: "openai/gpt-oss-20b:free",
      tags: sample.tags,
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    toast.success(`"${sample.name}" loaded in editor — save to keep it`);
  }

  const activeProject = editingProject ?? (activeProjectId ? getProject(activeProjectId) : null);

  function loadTemplate(tpl: PlaygroundProject) {
    setEditingProject({ ...tpl, id: `draft-${Date.now()}`, isTemplate: false });
    toast.success(`Template "${tpl.name}" loaded — save it to keep it`);
  }

  function handleCreate() {
    if (!newForm.name.trim()) { toast.error("Enter a project name"); return; }
    const id = saveProject({
      ...newForm,
      code: `// ${newForm.name}\n// Start coding here\n`,
      model: "openai/gpt-oss-20b:free",
      tags: [newForm.type, newForm.language],
    });
    setNewProject(false);
    toast.success("Project created");
  }

  function handleSave() {
    if (!activeProject) return;
    if (activeProject.id.startsWith("draft-")) {
      const id = saveProject({
        name: activeProject.name,
        description: activeProject.description,
        type: activeProject.type,
        language: activeProject.language,
        code: activeProject.code,
        model: activeProject.model,
        tags: activeProject.tags,
      });
      setEditingProject(null);
      toast.success("Project saved!");
    } else {
      updateProject(activeProject.id, { code: activeProject.code });
      setEditingProject(null);
      toast.success("Changes saved");
    }
  }

  async function copyCode() {
    if (!activeProject) return;
    await navigator.clipboard.writeText(activeProject.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCode() {
    if (!activeProject) return;
    const ext = activeProject.language === "python" ? "py" : activeProject.language === "typescript" ? "ts" : "js";
    const blob = new Blob([activeProject.code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${activeProject.name.replace(/\s+/g, "_").toLowerCase()}.${ext}`;
    a.click();
    toast.success(`Downloaded as .${ext} file`);
  }

  async function simulateRun() {
    if (!activeProject) return;
    setRunning(true);
    setRunOutput(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [
            {
              role: "system",
              content: "You are a code execution simulator. When given code, describe what it would output when run, as if you are the terminal. Be concise and realistic. Show fake but plausible output.",
            },
            { role: "user", content: `Simulate running this ${activeProject.language} code:\n\n\`\`\`${activeProject.language}\n${activeProject.code.slice(0, 2000)}\n\`\`\`` },
          ],
        }),
      });
      const data = await res.json();
      setRunOutput(data.content ?? "No output");
    } catch {
      setRunOutput("Error: Could not simulate execution");
    } finally {
      setRunning(false);
    }
  }

  async function askAI() {
    if (!aiPrompt.trim() || !activeProject) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [
            {
              role: "system",
              content: `You are an expert ${activeProject.language} developer specializing in AI applications. Help the user with their code. Be concise and practical.`,
            },
            {
              role: "user",
              content: `My code:\n\`\`\`${activeProject.language}\n${activeProject.code.slice(0, 1500)}\n\`\`\`\n\nQuestion: ${aiPrompt}`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiResponse(data.content ?? "");
      setAiPrompt("");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Playground" description="Build AI apps, agents, and workflows — save and learn" />

      {/* Import banner — shown when visiting a share link */}
      <AnimatePresence>
        {importBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 px-6 py-3 bg-primary/10 border-b border-primary/20 flex-shrink-0"
          >
            <ArrowDownToLine className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Shared project: </span>
              <span className="text-sm text-muted-foreground truncate">{importBanner.name}</span>
              <span className="text-xs text-muted-foreground ml-2">· {importBanner.language} · {importBanner.type}</span>
            </div>
            <Button size="sm" onClick={() => importSharedProject(importBanner)} className="gap-1.5 text-xs flex-shrink-0">
              <Download className="h-3.5 w-3.5" /> Import to My Projects
            </Button>
            <button onClick={() => setImportBanner(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue={activeProject ? "editor" : "templates"} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 border-b border-border bg-background flex-shrink-0">
          <TabsList className="my-2">
            <TabsTrigger value="templates" className="gap-2 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2 text-xs">
              <Code className="h-3.5 w-3.5" />
              Editor
              {activeProject && <span className="h-2 w-2 rounded-full bg-primary ml-0.5" />}
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 text-xs">
              <FolderOpen className="h-3.5 w-3.5" />
              My Projects
              {projects.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{projects.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <Button size="sm" onClick={() => setNewProject(true)} className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </div>

        {/* ── Templates ── */}
        <TabsContent value="templates" className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">

            {/* ── AI Sample Generator ── */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">AI Sample Generator</h2>
                <Badge variant="secondary" className="text-xs">Powered by AI</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Describe what you want to build — the AI writes a complete, production-ready code sample instantly.</p>

              {/* Config */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <select
                      value={sampleConfig.type}
                      onChange={e => setSampleConfig(s => ({ ...s, type: e.target.value as ProjectType }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {(["chatbot","agent","rag","workflow","api","custom"] as ProjectType[]).map(t => (
                        <option key={t} value={t} className="capitalize">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Language</label>
                    <select
                      value={sampleConfig.language}
                      onChange={e => setSampleConfig(s => ({ ...s, language: e.target.value as ProjectLanguage }))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {(["typescript","python","javascript"] as ProjectLanguage[]).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1 col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Topic / Idea</label>
                    <input
                      value={sampleConfig.topic}
                      onChange={e => setSampleConfig(s => ({ ...s, topic: e.target.value }))}
                      placeholder="e.g. PDF summarizer with citations"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={e => { if (e.key === "Enter") generateSample(false); }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => generateSample(false)}
                    disabled={generatingSample}
                    className="gap-2 flex-1 sm:flex-none"
                    size="sm"
                  >
                    {generatingSample ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                    Generate Sample
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateSample(true)}
                    disabled={generatingSample}
                    className="gap-2"
                    size="sm"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Surprise Me
                  </Button>
                  {aiSamples.length > 0 && (
                    <Button variant="ghost" size="sm" className="gap-2 ml-auto text-xs text-muted-foreground" onClick={() => setAiSamples([])}>
                      <X className="h-3.5 w-3.5" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Generated samples */}
              <AnimatePresence>
                {generatingSample && aiSamples.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 rounded-xl border border-border bg-muted/10 p-6 text-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Writing your code sample…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {aiSamples.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated Samples</p>
                    <span className="text-xs text-muted-foreground">{aiSamples.length} / 6</span>
                  </div>
                  {aiSamples.map((sample, idx) => {
                    const Icon = TYPE_ICONS[sample.type];
                    return (
                      <motion.div
                        key={sample.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx === 0 ? 0 : 0 }}
                      >
                        <Card className="overflow-hidden">
                          <div className={`h-0.5 bg-gradient-to-r ${TYPE_COLORS[sample.type]}`} />
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${TYPE_COLORS[sample.type]} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold">{sample.name}</p>
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LANG_COLORS[sample.language]}`}>{sample.language}</span>
                                  <Badge variant="secondary" className="text-xs gap-1"><Sparkles className="h-2.5 w-2.5" />AI Generated</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{sample.description}</p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {sample.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                                </div>
                              </div>
                            </div>

                            {/* Code preview */}
                            <div className="rounded-lg bg-[#1e1e2e] overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                                <span className="text-[10px] text-gray-500 font-mono">{sample.name.toLowerCase().replace(/\s+/g, "_")}.{sample.language === "python" ? "py" : sample.language === "typescript" ? "ts" : "js"}</span>
                                <span className="text-[10px] text-gray-600">{sample.code.split("\n").length} lines</span>
                              </div>
                              <pre className="px-3 py-2 text-[11px] text-[#cdd6f4] font-mono overflow-x-auto max-h-32 leading-relaxed scrollbar-hide">
                                {sample.code.split("\n").slice(0, 12).join("\n")}
                                {sample.code.split("\n").length > 12 && "\n// …"}
                              </pre>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => loadAiSample(sample)} className="gap-2 text-xs flex-1">
                                <Code className="h-3.5 w-3.5" /> Open in Editor
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={async () => {
                                await navigator.clipboard.writeText(sample.code);
                                toast.success("Code copied!");
                              }}>
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setAiSamples(prev => prev.filter(s => s.id !== sample.id))}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border mb-6" />

            <div className="mb-6">
              <h2 className="text-base font-semibold mb-1">Starter Templates</h2>
              <p className="text-sm text-muted-foreground">Click a template to load it in the editor, customize it, and save your project.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((tpl) => {
                const Icon = TYPE_ICONS[tpl.type];
                return (
                  <Card key={tpl.id} className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer overflow-hidden" onClick={() => loadTemplate(tpl)}>
                    <div className={`h-1 bg-gradient-to-r ${TYPE_COLORS[tpl.type]}`} />
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${TYPE_COLORS[tpl.type]} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{tpl.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LANG_COLORS[tpl.language]}`}>{tpl.language}</span>
                        {tpl.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                      </div>
                      <Button size="sm" variant="outline" className="w-full gap-2 text-xs group-hover:border-primary group-hover:text-primary transition-colors">
                        Open in Editor <ChevronRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Learning Path */}
            <div className="mt-8">
              <h2 className="text-base font-semibold mb-4">Learning Path</h2>
              <div className="space-y-2">
                {[
                  { step: 1, title: "Run your first AI chatbot", template: "tpl-chatbot", done: false },
                  { step: 2, title: "Add tools to create an agent", template: "tpl-agent", done: false },
                  { step: 3, title: "Build a RAG document Q&A", template: "tpl-rag", done: false },
                  { step: 4, title: "Orchestrate multi-step workflows", template: "tpl-workflow", done: false },
                ].map((item) => {
                  const tpl = TEMPLATES.find(t => t.id === item.template);
                  if (!tpl) return null;
                  return (
                    <div key={item.step} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent transition-all cursor-pointer" onClick={() => loadTemplate(tpl)}>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{tpl.language} · {tpl.type}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Editor ── */}
        <TabsContent value="editor" className="flex-1 overflow-hidden flex flex-col">
          {!activeProject ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-6">
              <Code className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Open a template or project to start editing</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setNewProject(true)} className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  New Project
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Code Editor */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{activeProject.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LANG_COLORS[activeProject.language]}`}>{activeProject.language}</span>
                    {activeProject.id.startsWith("draft-") && <Badge variant="warning" className="text-xs">Unsaved</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={copyCode} className="gap-1.5 text-xs h-7">
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={downloadCode} className="gap-1.5 text-xs h-7">
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={simulateRun} loading={running} className="gap-1.5 text-xs h-7">
                      <Play className="h-3 w-3" />
                      Simulate Run
                    </Button>
                    <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs h-7">
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </div>

                {/* Code textarea */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <textarea
                    value={activeProject.code}
                    onChange={e => setEditingProject({ ...activeProject, code: e.target.value })}
                    className="flex-1 w-full font-mono text-sm p-4 bg-[#1e1e2e] text-[#cdd6f4] resize-none outline-none leading-relaxed"
                    spellCheck={false}
                    style={{ tabSize: 2 }}
                  />
                </div>

                {/* Run Output */}
                {runOutput && (
                  <div className="border-t border-border h-36 bg-black flex-shrink-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                      <span className="text-xs text-green-400 font-mono">▶ Simulated Output</span>
                      <button onClick={() => setRunOutput(null)} className="text-white/40 hover:text-white/70"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <ScrollArea className="h-24">
                      <pre className="px-4 py-2 text-xs text-green-300 font-mono whitespace-pre-wrap">{runOutput}</pre>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* AI Help Sidebar */}
              <div className="w-80 border-l border-border flex flex-col flex-shrink-0 bg-background">
                <div className="p-3 border-b border-border">
                  <Button
                    size="sm"
                    variant={aiHelp ? "default" : "outline"}
                    onClick={() => setAiHelp(!aiHelp)}
                    className="w-full gap-2 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiHelp ? "Hide AI Help" : "AI Code Assistant"}
                  </Button>
                </div>

                {aiHelp && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 p-3">
                      {aiResponse && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap mb-3 p-3 rounded-lg bg-muted">
                          {aiResponse}
                        </div>
                      )}
                      {!aiResponse && (
                        <div className="py-6 text-center">
                          <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Ask the AI about your code</p>
                          <div className="mt-3 space-y-1.5">
                            {["Explain this code", "Add error handling", "Optimize this", "Add TypeScript types", "Write tests"].map(q => (
                              <button key={q} onClick={() => { setAiPrompt(q); }} className="w-full text-left text-xs px-2.5 py-2 rounded-lg hover:bg-accent transition-colors">
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-3 border-t border-border">
                      <div className="relative">
                        <textarea
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAI(); } }}
                          placeholder="Ask about your code…"
                          rows={2}
                          className="w-full text-xs rounded-xl border border-input bg-muted/40 px-3 py-2.5 pr-12 resize-none outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                        <button
                          onClick={askAI}
                          disabled={!aiPrompt.trim() || aiLoading}
                          className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground flex items-center justify-center transition-all shadow-sm"
                        >
                          {aiLoading
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
                    </div>
                  </div>
                )}

                {!aiHelp && (
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Project Info</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Type</span><span className="capitalize">{activeProject.type}</span></div>
                      <div className="flex justify-between"><span>Language</span><span className="capitalize">{activeProject.language}</span></div>
                      <div className="flex justify-between"><span>Lines</span><span>{activeProject.code.split("\n").length}</span></div>
                      <div className="flex justify-between"><span>Chars</span><span>{activeProject.code.length.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Projects ── */}
        <TabsContent value="projects" className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Saved Projects</h2>
              <Badge variant="secondary">{projects.length} projects</Badge>
            </div>

            {projects.length === 0 ? (
              <div className="py-16 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start from a template or create a new project</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => {
                  const Icon = TYPE_ICONS[project.type];
                  const isExpanded = expandedProjectId === project.id;
                  const isCopied   = copiedProjectId === project.id;
                  const ext = project.language === "python" ? "py" : project.language === "typescript" ? "ts" : "js";
                  return (
                    <Card
                      key={project.id}
                      className={`overflow-hidden transition-all ${activeProjectId === project.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                    >
                      <div className={`h-0.5 bg-gradient-to-r ${TYPE_COLORS[project.type]}`} />
                      <CardContent className="p-4">
                        {/* Top row — info + actions */}
                        <div className="flex items-start gap-3">
                          <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${TYPE_COLORS[project.type]} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{project.name}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LANG_COLORS[project.language]}`}>{project.language}</span>
                              {activeProjectId === project.id && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                              <span>·</span>
                              <span>{project.code.split("\n").length} lines</span>
                              <span>·</span>
                              <span className="capitalize">{project.type}</span>
                            </div>
                          </div>
                          {/* Delete */}
                          <button
                            onClick={() => { deleteProject(project.id); toast.success("Project deleted"); }}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                            title="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {/* Open in editor */}
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => { setActiveProject(project.id); setEditingProject(null); }}
                          >
                            <Code className="h-3.5 w-3.5" />
                            Open in Editor
                          </Button>

                          {/* Preview code toggle */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                          >
                            {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {isExpanded ? "Hide Code" : "Preview"}
                          </Button>

                          {/* Share */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => shareProject(project)}
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                            {isCopied ? "Copied!" : "Share"}
                          </Button>

                          {/* Export */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => exportProject(project)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export .{ext}
                          </Button>
                        </div>

                        {/* Expandable code preview */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 rounded-xl overflow-hidden border border-border">
                                <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e2e] border-b border-white/10">
                                  <span className="text-[10px] text-gray-500 font-mono">
                                    {project.name.toLowerCase().replace(/\s+/g, "_")}.{ext}
                                  </span>
                                  <button
                                    className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(project.code);
                                      toast.success("Code copied!");
                                    }}
                                  >
                                    <Copy className="h-2.5 w-2.5" /> Copy all
                                  </button>
                                </div>
                                <pre className="bg-[#1e1e2e] px-4 py-3 text-[11px] text-[#cdd6f4] font-mono overflow-x-auto max-h-64 overflow-y-auto leading-relaxed scrollbar-hide whitespace-pre">
                                  {project.code}
                                </pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Project Modal */}
      <AnimatePresence>
        {newProject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setNewProject(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">New Project</h3>
                <button onClick={() => setNewProject(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Project Name</label>
                  <input value={newForm.name} onChange={e => setNewForm(f => ({...f, name: e.target.value}))}
                    placeholder="My AI Agent" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <input value={newForm.description} onChange={e => setNewForm(f => ({...f, description: e.target.value}))}
                    placeholder="What does this project do?" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <select value={newForm.type} onChange={e => setNewForm(f => ({...f, type: e.target.value as ProjectType}))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                      {(["chatbot","agent","rag","workflow","api","custom"] as ProjectType[]).map(t => (
                        <option key={t} value={t} className="capitalize">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Language</label>
                    <select value={newForm.language} onChange={e => setNewForm(f => ({...f, language: e.target.value as ProjectLanguage}))}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                      {(["typescript","python","javascript"] as ProjectLanguage[]).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setNewProject(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreate} className="flex-1 gap-2"><Plus className="h-3.5 w-3.5" />Create</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
