"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import {
  LayoutDashboard,
  Newspaper,
  Cpu,
  FlaskConical,
  GraduationCap,
  Bot,
  Search,
  Network,
  TrendingUp,
  Zap,
  Users,
  Swords,
  Radar,
  BookOpen,
  Sparkles,
  Building2,
  NotebookPen,
  Code,
  ChevronRight,
  X,
  Archive,
  Package,
} from "lucide-react";

type BadgeType = "HOT" | "NEW" | "AI" | null;

const NAV_ITEMS: { href: string; label: string; icon: React.ElementType; desc: string; badge: BadgeType; highlight?: boolean }[] = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard, desc: "AI intelligence overview",   badge: null },
  { href: "/news",       label: "News",            icon: Newspaper,       desc: "Real-time AI updates",       badge: "HOT",  highlight: true },
  { href: "/models",     label: "Models",          icon: Cpu,             desc: "AI model directory",         badge: null },
  { href: "/repos",      label: "RepoHub",         icon: Package,         desc: "Discover AI repositories",   badge: "NEW", highlight: true },
  { href: "/research",   label: "Research",        icon: FlaskConical,    desc: "arXiv & Semantic Scholar",   badge: null },
  { href: "/tutorials",  label: "Tutorials",       icon: GraduationCap,   desc: "Learn AI development",       badge: "NEW" },
  { href: "/agents",     label: "Agents",          icon: Bot,             desc: "AI expert assistants",       badge: "AI",   highlight: true },
  { href: "/search",     label: "AIHub Google",    icon: Search,          desc: "AI-only search engine",      badge: null },
  { href: "/graph",      label: "Brain",           icon: Network,         desc: "Obsidian knowledge graph",   badge: "HOT",  highlight: true },
  { href: "/trends",     label: "Trends",          icon: TrendingUp,      desc: "AI ecosystem analytics",     badge: null },
  { href: "/skills",     label: "Skills",          icon: BookOpen,        desc: "AI skill library",           badge: null },
  { href: "/workflows",  label: "Workflows",       icon: Zap,             desc: "Automation templates",       badge: null },
  { href: "/community",  label: "Community",       icon: Users,           desc: "Discussions & reviews",      badge: null },
  { href: "/generator",  label: "Generator",       icon: Sparkles,        desc: "Create skills & agents",     badge: "NEW", highlight: true },
  { href: "/archive",    label: "Archive",         icon: Archive,         desc: "Community skills & agents",  badge: "NEW", highlight: true },
  { href: "/aihumlm",    label: "AIHub LM",        icon: NotebookPen,     desc: "AI assistant & digest",      badge: "AI",   highlight: true },
  { href: "/playground", label: "Playground",      icon: Code,            desc: "Model testing sandbox",      badge: "NEW" },
];

const BONUS_ITEMS: { href: string; label: string; icon: React.ElementType; desc: string; badge: BadgeType }[] = [
  { href: "/radar",     label: "AI Radar",        icon: Radar,     desc: "Ecosystem monitoring",      badge: "NEW" },
  { href: "/battle",    label: "Battle Arena",    icon: Swords,    desc: "Model comparisons",         badge: null },
  { href: "/companies", label: "Company Tracker", icon: Building2, desc: "AI company intelligence",   badge: null },
];

function NavBadge({ type }: { type: BadgeType }) {
  if (!type) return null;
  if (type === "HOT") {
    return (
      <span className="ml-1.5 text-[9px] font-bold text-red-400 animate-pulse leading-none" style={{ textShadow: "0 0 8px rgba(248,113,113,0.8)" }}>
        HOT
      </span>
    );
  }
  if (type === "NEW") {
    return (
      <span className="ml-1.5 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold leading-none">
        NEW
      </span>
    );
  }
  return (
    <span className="ml-1.5 text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded font-semibold leading-none">
      AI
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useStore();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const content = (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-indigo-400/80 uppercase tracking-widest leading-none mb-1">Intelligence Hub</div>
            <div className="font-black text-xl leading-none bg-gradient-to-r from-white via-white to-indigo-300 bg-clip-text text-transparent">AIHub</div>
          </div>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* AI Copilot Active */}
      <div className="mx-4 mt-4 mb-2 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
        <span className="text-green-400 text-xs font-medium">AI Copilot Active</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={cn("sidebar-item group", active && "active", item.highlight && !active && "border-indigo-500/10 bg-indigo-500/5")}>
                  <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", active ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium leading-none flex items-center", active ? "text-indigo-300" : "")}>
                      {item.label}
                      {item.badge && <NavBadge type={item.badge} />}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5 truncate">{item.desc}</div>
                  </div>
                  {active && <ChevronRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="my-3 border-t border-white/5" />

        <div className="mb-1 px-1">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">More</span>
        </div>
        <div className="space-y-0.5">
          {BONUS_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={cn("sidebar-item group", active && "active")}>
                  <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", active ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium leading-none flex items-center", active ? "text-indigo-300" : "")}>
                      {item.label}
                      {item.badge && <NavBadge type={item.badge} />}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5 truncate">{item.desc}</div>
                  </div>
                  {active && <ChevronRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white leading-none">AIHub</div>
              <div className="text-[10px] text-gray-600 leading-none mt-0.5">The AI Homepage</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-600">v1.0 · OpenRouter &amp; Ollama</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-[#0d1526] border-r border-white/5 flex flex-col h-screen fixed top-0 left-0 z-40 transition-transform duration-300",
          // Mobile: hidden off-screen by default, slide in when open
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {content}
      </aside>
    </>
  );
}
