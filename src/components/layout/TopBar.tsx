"use client";

import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/layout/NotificationPanel";
import { Search, Moon, Sun, Command, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface TopBarProps {
  title?: string;
  description?: string;
}

// ─── Detect device type client-side ──────────────────────────────────────────
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|tablet|Tablet/i.test(ua)) return "tablet";
  if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return "mobile";
  return "desktop";
}

// ─── Generate / retrieve a persistent session ID ─────────────────────────────
function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("aihub_sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("aihub_sid", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// ─── Real-time online counter backed by Neon DB ───────────────────────────────
function OnlineUsers() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    const deviceType = getDeviceType();

    async function beat() {
      try {
        const res = await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId:  sessionIdRef.current,
            page:       pathname,
            deviceType,
          }),
        });
        if (res.ok) {
          const { online } = await res.json();
          setCount(online);
        }
      } catch { /* ignore — network error */ }
    }

    beat(); // immediate on mount / page change

    const interval = setInterval(beat, 30_000); // every 30s
    return () => clearInterval(interval);
  }, [pathname]);

  if (count === null) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border border-border/60 px-2.5 py-1 rounded-full select-none">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>{count} online</span>
    </div>
  );
}

export function TopBar({ title, description }: TopBarProps) {
  const { setCommandOpen, setSidebarOpen } = useStore();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (localSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex flex-1 items-center gap-4">
        {title && (
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <Input
            placeholder="Search AI news, models, research..."
            icon={<Search className="h-3.5 w-3.5" />}
            suffix={
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Command className="h-3 w-3" />
                <span>K</span>
              </button>
            }
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <OnlineUsers />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <NotificationBell />
      </div>
    </header>
  );
}
