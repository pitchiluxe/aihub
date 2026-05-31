"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommunityStore, CommunityPost, PostType } from "@/store/community";
import {
  Heart, Eye, Hash, MessageSquare, X, Plus, Code, Lightbulb,
  Zap, HelpCircle, Star, Flame, Clock, Trophy, Search,
  ChevronDown, ChevronUp, Copy, Check, Trash2, Pin, User,
} from "lucide-react";
import toast from "react-hot-toast";

const TYPE_CONFIG: Record<PostType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  prompt:   { label: "Prompt",   icon: Star,         color: "text-pink-600",   bg: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800" },
  project:  { label: "Project",  icon: Code,         color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  workflow: { label: "Workflow", icon: Zap,          color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  insight:  { label: "Insight",  icon: Lightbulb,    color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  question: { label: "Question", icon: HelpCircle,   color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" },
};

const POPULAR_TAGS = ["agents", "prompts", "RAG", "OpenRouter", "Ollama", "LangChain", "DeepSeek", "GPT-4o", "Claude", "Python", "TypeScript", "workflow", "fine-tuning", "MCP"];

export default function CommunityPage() {
  const { posts, username, setUsername, addPost, deletePost, toggleLike, incrementView, comments, addComment } = useCommunityStore();

  const [activeFilter, setActiveFilter] = useState<PostType | "all">("all");
  const [sortBy, setSortBy]             = useState<"recent" | "top" | "hot">("hot");
  const [search, setSearch]             = useState("");
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [editingName, setEditingName]   = useState(false);
  const [nameInput, setNameInput]       = useState(username);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // New post form
  const [form, setForm] = useState({
    type: "insight" as PostType,
    title: "",
    content: "",
    code: "",
    codeLanguage: "typescript",
    tags: [] as string[],
    tagInput: "",
  });

  function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content are required"); return; }
    addPost({
      type: form.type,
      title: form.title,
      content: form.content,
      code: form.code || undefined,
      codeLanguage: form.code ? form.codeLanguage : undefined,
      tags: form.tags,
      pinned: false,
    });
    setForm({ type: "insight", title: "", content: "", code: "", codeLanguage: "typescript", tags: [], tagInput: "" });
    setShowCreate(false);
    toast.success("Posted to the community! 🎉");
  }

  function addTag(tag: string) {
    if (!tag.trim() || form.tags.includes(tag)) return;
    setForm(f => ({ ...f, tags: [...f.tags, tag.trim()], tagInput: "" }));
  }

  function filtered() {
    let result = [...posts];
    if (activeFilter !== "all") result = result.filter(p => p.type === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === "top")    result.sort((a, b) => b.likes - a.likes);
    else if (sortBy === "hot") result.sort((a, b) => (b.likes * 2 + b.views * 0.1) - (a.likes * 2 + a.views * 0.1));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Pinned always first
    return [...result.filter(p => p.pinned), ...result.filter(p => !p.pinned)];
  }

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleExpand(id: string) {
    if (expandedId !== id) incrementView(id);
    setExpandedId(expandedId === id ? null : id);
  }

  const displayedPosts = filtered();

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Community" description="Share your AI projects, prompts, insights, and questions" />
      <div className="flex-1 flex overflow-hidden">
        {/* Main Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Header controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search posts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 h-8 rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1">
              {(["hot","top","recent"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize flex items-center gap-1 ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                  {s === "hot" && <Flame className="h-3 w-3" />}
                  {s === "top" && <Trophy className="h-3 w-3" />}
                  {s === "recent" && <Clock className="h-3 w-3" />}
                  {s}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2 text-xs ai-gradient border-0">
              <Plus className="h-3.5 w-3.5" />
              Post
            </Button>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveFilter("all")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
              All ({posts.length})
            </button>
            {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([type, cfg]) => (
              <button key={type} onClick={() => setActiveFilter(type)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                <cfg.icon className="h-3 w-3" />
                {cfg.label} ({posts.filter(p => p.type === type).length})
              </button>
            ))}
          </div>

          {/* Posts */}
          <AnimatePresence initial={false}>
            {displayedPosts.map((post, i) => {
              const cfg = TYPE_CONFIG[post.type];
              const isExpanded = expandedId === post.id;
              const postComments = comments.filter(c => c.postId === post.id);
              const isOwn = post.author === username;

              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`overflow-hidden ${post.pinned ? "border-primary/40 shadow-sm" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Vote */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                          <button onClick={() => toggleLike(post.id)}
                            className={`flex flex-col items-center gap-0.5 transition-all ${post.likedByMe ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                            <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""}`} />
                            <span className="text-xs font-semibold">{post.likes}</span>
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                              <cfg.icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                            {post.pinned && <span className="flex items-center gap-1 text-xs text-primary font-medium"><Pin className="h-3 w-3" />Pinned</span>}
                          </div>

                          <div className="cursor-pointer" onClick={() => handleExpand(post.id)}>
                            <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-snug">{post.title}</h3>
                            <p className={`text-xs text-muted-foreground mt-1 leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                              {post.content}
                            </p>
                          </div>

                          {/* Code block */}
                          {post.code && isExpanded && (
                            <div className="relative rounded-lg overflow-hidden border border-border">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
                                <span className="text-xs font-mono text-muted-foreground">{post.codeLanguage}</span>
                                <button onClick={() => copyCode(post.id, post.code!)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                  {copiedId === post.id ? <><Check className="h-3 w-3 text-green-500"/>Copied</> : <><Copy className="h-3 w-3"/>Copy</>}
                                </button>
                              </div>
                              <pre className="p-3 text-xs font-mono bg-[#1e1e2e] text-[#cdd6f4] overflow-x-auto max-h-64 whitespace-pre-wrap">
                                {post.code}
                              </pre>
                            </div>
                          )}

                          {/* Tags */}
                          {post.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {post.tags.map(tag => (
                                <span key={tag} onClick={() => setSearch(tag)}
                                  className="flex items-center gap-0.5 text-xs text-primary cursor-pointer hover:underline">
                                  <Hash className="h-2.5 w-2.5"/>{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">{post.avatar}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{post.author}</span>
                            </div>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1"><Eye className="h-3 w-3"/>{post.views}</div>
                            <button onClick={() => handleExpand(post.id)} className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
                              <MessageSquare className="h-3 w-3"/>
                              {postComments.length}
                              {isExpanded ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
                            </button>
                            {isOwn && (
                              <button onClick={() => { deletePost(post.id); toast.success("Post deleted"); }}
                                className="text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-3 w-3"/>
                              </button>
                            )}
                          </div>

                          {/* Comments */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-border space-y-2">
                              {postComments.map(c => (
                                <div key={c.id} className="flex gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarFallback className="text-[10px]">{c.avatar}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                                    <p className="text-xs font-medium">{c.author}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-2 mt-2">
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  <AvatarFallback className="text-[10px]">{username.slice(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <input
                                  placeholder="Add a comment..."
                                  value={commentInputs[post.id] ?? ""}
                                  onChange={e => setCommentInputs(prev => ({...prev, [post.id]: e.target.value}))}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && commentInputs[post.id]?.trim()) {
                                      addComment({ postId: post.id, content: commentInputs[post.id]! });
                                      setCommentInputs(prev => ({...prev, [post.id]: ""}));
                                    }
                                  }}
                                  className="flex-1 text-xs rounded-full border border-input bg-background px-3 py-1.5 outline-none focus:ring-1 focus:ring-ring"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {displayedPosts.length === 0 && (
            <div className="py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No posts match your filter.</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-64 border-l border-border flex flex-col flex-shrink-0 overflow-y-auto p-4 space-y-4 hidden lg:flex">
          {/* Your Profile */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-bold">{username.slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onBlur={() => { setUsername(nameInput); setEditingName(false); toast.success("Name updated"); }}
                      onKeyDown={e => { if (e.key === "Enter") { setUsername(nameInput); setEditingName(false); } }}
                      autoFocus
                      className="w-full text-sm border-b border-primary outline-none bg-transparent"
                    />
                  ) : (
                    <button onClick={() => { setNameInput(username); setEditingName(true); }} className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1">
                      {username}
                      <User className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">{posts.filter(p=>p.author===username).length} posts · {posts.filter(p=>p.author===username&&p.likedByMe).length} liked</p>
                </div>
              </div>
              <Button size="sm" className="w-full gap-2 text-xs ai-gradient border-0" onClick={() => setShowCreate(true)}>
                <Plus className="h-3.5 w-3.5" />
                Share Something
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community</p>
              {[
                { label: "Total Posts", value: posts.length },
                { label: "Total Likes", value: posts.reduce((s,p)=>s+p.likes,0) },
                { label: "Total Views", value: posts.reduce((s,p)=>s+p.views,0).toLocaleString() },
                { label: "Comments", value: comments.length },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trending Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TAGS.map(tag => (
                  <button key={tag} onClick={() => setSearch(tag)}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    #{tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Community Rules */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Guidelines</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-primary">✓</span>Share AI projects, prompts, workflows, insights</li>
                <li className="flex items-start gap-1.5"><span className="text-primary">✓</span>Include code when helpful</li>
                <li className="flex items-start gap-1.5"><span className="text-primary">✓</span>Be constructive and respectful</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive">✗</span>No external links or self-promotion</li>
                <li className="flex items-start gap-1.5"><span className="text-destructive">✗</span>Keep it AI-related</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
                <h3 className="text-base font-semibold">Share with the Community</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              <ScrollArea className="flex-1 p-5">
                <div className="space-y-4">
                  {/* Type */}
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([type, cfg]) => (
                      <button key={type} onClick={() => setForm(f => ({...f, type}))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.type === type ? `border-primary text-primary bg-primary/5` : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Title *</label>
                    <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                      placeholder="What's your post about?" maxLength={120}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Content *</label>
                    <textarea value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))}
                      placeholder="Share your knowledge, experience, or question..." rows={5}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Code (optional)</label>
                    <div className="flex gap-2 mt-1 mb-1.5">
                      {["typescript","python","javascript","bash","markdown"].map(l => (
                        <button key={l} onClick={() => setForm(f=>({...f,codeLanguage:l}))}
                          className={`px-2 py-0.5 rounded text-xs border transition-all ${form.codeLanguage === l ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <textarea value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))}
                      placeholder={`Paste your ${form.codeLanguage} code here...`} rows={6}
                      className="w-full rounded-lg border border-input bg-[#1e1e2e] text-[#cdd6f4] px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <input value={form.tagInput} onChange={e => setForm(f=>({...f,tagInput:e.target.value}))}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(form.tagInput); }}}
                        placeholder="Add tags (Enter to add)..."
                        className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {form.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          #{tag}
                          <button onClick={() => setForm(f=>({...f,tags:f.tags.filter(t=>t!==tag)}))}><X className="h-2.5 w-2.5"/></button>
                        </span>
                      ))}
                      {POPULAR_TAGS.slice(0,6).map(tag => !form.tags.includes(tag) && (
                        <button key={tag} onClick={() => addTag(tag)}
                          className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 p-4 border-t border-border flex-shrink-0">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} className="flex-1 gap-2 ai-gradient border-0">
                  <Plus className="h-3.5 w-3.5" />
                  Post to Community
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
