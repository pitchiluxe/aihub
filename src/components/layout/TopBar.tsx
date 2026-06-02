"use client";

import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/layout/NotificationPanel";
import { Search, Moon, Sun, Command, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface TopBarProps {
  title?: string;
  description?: string;
}

function OnlineUsers() {
  const [count, setCount] = useState(2);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setCount((prev) => Math.max(1, Math.min(50, prev + (Math.random() > 0.5 ? 1 : -1))));
    };
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => { tick(); schedule(); }, 3000 + Math.random() * 5000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  if (!mounted) return null;

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
