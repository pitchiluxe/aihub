"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Newspaper, Cpu, FlaskConical, GraduationCap,
  Bot, Search, Network, TrendingUp, Zap, Users, Swords, Radar,
  BookOpen, Building2, NotebookPen, X,
} from "lucide-react";

const COMMANDS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
  { label: "News Center", href: "/news", icon: Newspaper, group: "Navigation" },
  { label: "Models Hub", href: "/models", icon: Cpu, group: "Navigation" },
  { label: "Research", href: "/research", icon: FlaskConical, group: "Navigation" },
  { label: "Tutorials", href: "/tutorials", icon: GraduationCap, group: "Navigation" },
  { label: "AI Agents", href: "/agents", icon: Bot, group: "Navigation" },
  { label: "AIHub Google", href: "/search", icon: Search, group: "Navigation" },
  { label: "Obsidian Graph", href: "/graph", icon: Network, group: "Navigation" },
  { label: "Trends", href: "/trends", icon: TrendingUp, group: "Navigation" },
  { label: "Skills", href: "/skills", icon: BookOpen, group: "Navigation" },
  { label: "Workflows", href: "/workflows", icon: Zap, group: "Navigation" },
  { label: "Community", href: "/community", icon: Users, group: "Navigation" },
  { label: "AI Radar", href: "/radar", icon: Radar, group: "Features" },
  { label: "Battle Arena", href: "/battle", icon: Swords, group: "Features" },
  { label: "Company Tracker", href: "/companies", icon: Building2, group: "Features" },
  { label: "AIHub LM", href: "/aihumlm", icon: NotebookPen, group: "Features" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useStore();
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === "Escape") setCommandOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [commandOpen, setCommandOpen]);

  const filtered = query
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const groups = filtered.reduce<Record<string, typeof COMMANDS>>(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {}
  );

  function handleSelect(href: string) {
    router.push(href);
    setCommandOpen(false);
    setQuery("");
  }

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
          >
            <div className="flex items-center border-b border-border px-4 py-3 gap-3">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                placeholder="Search commands, pages, features..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => setCommandOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group}
                  </p>
                  {items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors group"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
