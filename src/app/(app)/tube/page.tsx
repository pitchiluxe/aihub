"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import {
  CirclePlay, Play, RotateCcw, Loader2, Bot, Cpu, Wrench, BookMarked,
  Wand2, Key, Newspaper, FlaskConical, Search, X, ExternalLink, Sparkles,
  ChevronRight, Code2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
type AIVideoCategory =
  | "All"
  | "Tutorials"
  | "Model Reviews"
  | "Agents & Automation"
  | "News & Updates"
  | "Research"
  | "Coding"
  | "Tools"
  | "Prompting";

interface AIVideo {
  id: string;
  title: string;
  channel: string;
  description: string;
  thumbnail: string;
  category: Omit<AIVideoCategory, "All">;
  publishedAt: string;
}

// ─── Category config ────────────────────────────────────────────────────────
const AI_CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  "Tutorials":           { icon: BookMarked,   color: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30" },
  "Model Reviews":       { icon: Cpu,          color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  "Agents & Automation": { icon: Bot,          color: "text-violet-400 bg-violet-500/15 border-violet-500/30" },
  "News & Updates":      { icon: Newspaper,    color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  "Research":            { icon: FlaskConical, color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" },
  "Coding":              { icon: Code2,        color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  "Tools":               { icon: Wrench,       color: "text-orange-400 bg-orange-500/15 border-orange-500/30" },
  "Prompting":           { icon: Wand2,        color: "text-pink-400 bg-pink-500/15 border-pink-500/30" },
};

const AI_VIDEO_CATEGORIES: AIVideoCategory[] = [
  "All", "Tutorials", "Model Reviews", "Agents & Automation",
  "News & Updates", "Research", "Coding", "Tools", "Prompting",
];

// ─── Setup screen ────────────────────────────────────────────────────────────
function AITubeSetupScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8 max-w-lg mx-auto">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl flex items-center justify-center mb-5">
        <Key className="w-8 h-8 text-yellow-400" />
      </div>
      <h2 className="text-lg font-black text-white mb-2">YouTube API Key Required</h2>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        AITube uses the free YouTube Data API to fetch real, playable videos.
        Add a <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">YOUTUBE_API_KEY</code> to get started.
      </p>
      <div className="w-full bg-white/3 border border-white/8 rounded-xl p-5 text-left mb-5 space-y-3">
        <p className="text-xs font-bold text-white uppercase tracking-wider">Setup — 3 steps</p>
        {[
          { step: "1", text: "Go to Google Cloud Console → APIs & Services → YouTube Data API v3 → Enable" },
          { step: "2", text: "Create credentials → API Key → copy it" },
          { step: "3", text: "Add YOUTUBE_API_KEY=your_key to .env.local + Vercel project settings" },
        ].map(({ step, text }) => (
          <div key={step} className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-5 h-5 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] font-black text-red-400 flex items-center justify-center">{step}</span>
            <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
      <a
        href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        <CirclePlay className="w-4 h-4" />
        Open Google Cloud Console
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
      <p className="text-[11px] text-slate-600 mt-4">Free tier gives 10,000 quota units/day — enough for ~100 fetches.</p>
    </div>
  );
}

// ─── Video card ──────────────────────────────────────────────────────────────
function AIVideoCard({
  video, isSelected, onClick, index,
}: {
  video: AIVideo; isSelected: boolean; onClick: () => void; index: number;
}) {
  const cat = AI_CATEGORY_CONFIG[video.category as string] ?? AI_CATEGORY_CONFIG["Tutorials"];
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.22 }}
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-200 ${
        isSelected
          ? "border-red-500/60 ring-1 ring-red-500/30 bg-[#180a0a]"
          : "border-white/6 bg-[#0d1421] hover:border-white/15 hover:bg-[#111827]"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#070b12] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.src.includes("mqdefault")) {
              img.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
            }
          }}
        />
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isSelected ? "opacity-100 bg-red-500/20" : "opacity-0 group-hover:opacity-100 bg-black/40"
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ${
            isSelected ? "bg-red-500" : "bg-white/90"
          }`}>
            <Play className={`w-5 h-5 ml-0.5 ${isSelected ? "text-white" : "text-gray-900"}`} fill="currentColor" />
          </div>
        </div>
        {isSelected && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            PLAYING
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2 mb-1.5">{video.title}</h3>
        <p className="text-[10px] text-slate-500 mb-2">{video.channel}</p>
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cat.color}`}>
          <CatIcon className="w-2.5 h-2.5" />
          {video.category}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function TubePage() {
  const [videos, setVideos] = useState<AIVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<AIVideoCategory>("All");
  const [selectedVideo, setSelectedVideo] = useState<AIVideo | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  async function fetchVideos(append = false) {
    if (append) setLoadingMore(true);
    else { setLoading(true); setSelectedVideo(null); setNeedsSetup(false); }

    try {
      const res = await fetch(`/api/ai-tube${append ? "?append=true" : ""}`);
      const data = await res.json();
      if (data.setup) { setNeedsSetup(true); return; }
      if (!res.ok) throw new Error(data.error || "Failed to fetch videos");
      const incoming: AIVideo[] = data.videos ?? [];
      if (append) {
        setVideos((prev) => {
          const ids = new Set(prev.map((v) => v.id));
          return [...prev, ...incoming.filter((v) => !ids.has(v.id))];
        });
      } else {
        setVideos(incoming);
        setHasFetched(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { fetchVideos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const matchCat = activeCategory === "All" || v.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q) || (v.category as string).toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [videos, search, activeCategory]);

  return (
    <div className="flex flex-col h-screen bg-[#080f1f]">
      <TopBar title="AI Tube" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <CirclePlay className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">AI Tube</h1>
                <p className="text-xs text-slate-500">Top AI creators · Last 2 weeks · Real YouTube videos</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              {videos.length > 0 && (
                <span className="text-xs text-slate-500 bg-white/5 border border-white/8 rounded-full px-3 py-1">
                  {filtered.length} / {videos.length} videos
                </span>
              )}
              <button
                onClick={() => fetchVideos(false)}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  loading
                    ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                    : "bg-red-500/15 border-red-500/35 text-red-300 hover:bg-red-500/25 hover:border-red-500/50"
                }`}
              >
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Fetching…</>
                  : <><RotateCcw className="w-3.5 h-3.5" />Refresh</>}
              </button>
              {hasFetched && !needsSetup && (
                <button
                  onClick={() => fetchVideos(true)}
                  disabled={loadingMore}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    loadingMore
                      ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                      : "bg-violet-500/15 border-violet-500/35 text-violet-300 hover:bg-violet-500/25 hover:border-violet-500/50"
                  }`}
                >
                  {loadingMore
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</>
                    : <><Sparkles className="w-3.5 h-3.5" />AI Generate More</>}
                </button>
              )}
            </div>
          </div>

          {/* ── Setup screen ── */}
          {needsSetup && !loading && <AITubeSetupScreen />}

          {/* ── Inline player ── */}
          <AnimatePresence>
            {selectedVideo && (
              <motion.div
                key={selectedVideo.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-[#0a0a14] border border-red-500/25 rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10">
                  <div className="flex items-start gap-3 p-4 border-b border-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Now Playing</span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{selectedVideo.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedVideo.channel}</p>
                    </div>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      key={selectedVideo.id}
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{selectedVideo.description}</p>
                    <a
                      href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Search + category filters ── */}
          {!needsSetup && videos.length > 0 && (
            <div className="mb-5 space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by title, channel…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0d1421] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/40 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-slate-500 hover:text-white transition-colors" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
                {AI_VIDEO_CATEGORIES.map((cat) => {
                  const config = cat === "All" ? null : AI_CATEGORY_CONFIG[cat as string];
                  const Icon = config?.icon;
                  const count = cat === "All" ? videos.length : videos.filter((v) => v.category === cat).length;
                  if (count === 0 && cat !== "All") return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activeCategory === cat
                          ? "bg-red-500/20 border-red-500/40 text-red-300"
                          : "bg-transparent border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300"
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/6 bg-[#0d1421] overflow-hidden animate-pulse">
                  <div className="aspect-video bg-white/5" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-white/8 rounded w-4/5" />
                    <div className="h-3 bg-white/5 rounded w-3/5" />
                    <div className="h-4 w-20 bg-white/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !needsSetup && videos.length === 0 && hasFetched && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                <CirclePlay className="w-8 h-8 text-red-400/60" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">No videos found</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">No recent AI videos found. Try refreshing or check back later.</p>
              <button onClick={() => fetchVideos(false)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* ── Video grid ── */}
          {!loading && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((video, i) => (
                  <AIVideoCard
                    key={video.id}
                    video={video}
                    isSelected={selectedVideo?.id === video.id}
                    onClick={() => setSelectedVideo((prev) => prev?.id === video.id ? null : video)}
                    index={i}
                  />
                ))}
              </div>

              {/* Load more skeleton */}
              {loadingMore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/6 bg-[#0d1421] overflow-hidden animate-pulse">
                      <div className="aspect-video bg-white/5" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-white/8 rounded w-4/5" />
                        <div className="h-3 bg-white/5 rounded w-3/5" />
                        <div className="h-4 w-20 bg-white/5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom generate button */}
              {!loadingMore && hasFetched && !needsSetup && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => fetchVideos(true)}
                    className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-all hover:shadow-lg hover:shadow-violet-500/20 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Generate More Videos
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
