"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useArchiveStore, ArchivedItem } from "@/store/archive";
import { TopBar } from "@/components/layout/TopBar";
import {
  ArrowLeft, Copy, Check, Download, Code, Zap,
  Wand2, Lightbulb, Calendar, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  skill:  { icon: Code,      color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",   label: "Skill" },
  agent:  { icon: Zap,       color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", label: "Agent" },
  prompt: { icon: Wand2,     color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20",   label: "Prompt" },
  idea:   { icon: Lightbulb, color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20", label: "Idea" },
} as const;

export default function ArchiveItemPage() {
  const { id } = useParams<{ id: string }>();
  const { items } = useArchiveStore();
  const [item, setItem] = useState<ArchivedItem | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Wait for store hydration from localStorage
    const found = items.find((i) => i.id === id);
    setItem(found ?? null);
  }, [items, id]);

  async function handleCopy() {
    if (!item) return;
    await navigator.clipboard.writeText(item.code);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied!");
  }

  async function handleDownload() {
    if (!item) return;
    const blob = new Blob([item.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  }

  // Still hydrating
  if (item === undefined) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar title="Archive" description="Shared item" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not found
  if (item === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar title="Archive" description="Shared item" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="text-6xl mb-2">📦</div>
          <h2 className="text-xl font-semibold text-white">Item not found</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            This item only exists in the browser it was created in. It hasn&apos;t been synced to a shared database yet.
          </p>
          <Link href="/archive">
            <Button variant="outline" size="sm" className="mt-2">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Archive
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.skill;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Archive" description="Shared item" />

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">
        {/* Back */}
        <Link href="/archive">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Archive
          </Button>
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/8 bg-white/3 p-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl border", cfg.bg)}>
                <Icon className={cn("w-5 h-5", cfg.color)} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">{item.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={cn("text-xs border", cfg.bg, cfg.color)}>
                {cfg.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-4 text-[11px] text-gray-600">
            <Calendar className="w-3 h-3" />
            {new Date(item.archivedAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleCopy} size="sm" variant="outline" className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Content"}
          </Button>
          <Button onClick={handleDownload} size="sm" variant="outline" className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download .md
          </Button>
          <Button onClick={handleShare} size="sm" variant="outline" className="gap-1.5">
            <Share2 className="w-3.5 h-3.5" /> Copy Share Link
          </Button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/8 bg-black/30 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-white/2">
            <span className="text-[11px] text-gray-500 font-mono">{item.name}.md</span>
            <button
              onClick={handleCopy}
              className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto scrollbar-hide">
            {item.code}
          </pre>
        </motion.div>
      </div>
    </div>
  );
}
